import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'motion/react';

interface Props {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared backdrop + card shell for every dialog in the app (avatar picker,
 * settings, confirmations). Escape and backdrop-click both close; the caller
 * owns everything inside.
 */
export function Modal({ open, onClose, label, children, className = '' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Portalled to <body> — rendered from inside the sticky, backdrop-filtered
  // navbar otherwise, and `backdrop-filter` on an ancestor creates a new
  // containing block for `position: fixed`, which centers the dialog inside
  // the 68px navbar strip instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            className={`modal ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
