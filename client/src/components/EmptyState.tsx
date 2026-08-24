import type { ReactNode } from 'react';
import { m } from 'motion/react';

interface Props {
  icon: string;
  title: string;
  body: string;
  action?: ReactNode;
}

/** Shared shape for "nothing to show" — empty filter results, dead search, or a fetch that failed. */
export function EmptyState({ icon, title, body, action }: Props) {
  return (
    <m.div
      className="emptystate"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
    >
      <span className="emptystate__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="emptystate__title">{title}</p>
      <p className="emptystate__body">{body}</p>
      {action}
    </m.div>
  );
}
