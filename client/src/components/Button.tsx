import type { ReactNode } from 'react';
import { m } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size = 'md' | 'lg';

// Based on motion's own button props (not React.ButtonHTMLAttributes) — the two
// disagree on a handful of event signatures, so extending both is a type error.
interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

/** One button for the whole app — hover lift, press scale, and a spinner state so "Joining…" reads as busy, not broken. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <m.button
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={isDisabled ? undefined : { y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...rest}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </m.button>
  );
}
