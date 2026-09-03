import { m } from 'motion/react';
import { BrandMark } from './BrandMark.js';
import { spring } from '../lib/motion.js';

interface Props {
  size?: 'lg' | 'md';
  tagline?: string;
}

const ICON_SIZE = { lg: 76, md: 52 } as const;

/**
 * The full lockup (mark + wordmark) for menu/lobby screens — home hero, host
 * lobby, player lobby. SVG + CSS, not a raster export, so it themes and
 * scales with everything else instead of sitting in the page as a boxed image.
 */
export function Banner({ size = 'lg', tagline }: Props) {
  return (
    <m.div
      className={`banner banner--${size}`}
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.pop}
    >
      <span className="banner__glow" aria-hidden="true" />
      <BrandMark size={ICON_SIZE[size]} variant="tile" />
      <span className="banner__wordmark">
        Ryzz<span className="banner__wordmark-accent">Quizz</span>
      </span>
      {tagline && <span className="banner__tagline">{tagline}</span>}
    </m.div>
  );
}
