import { useState } from 'react';

let uid = 0;

interface Props {
  size?: number;
  /** "mark" — transparent, for the navbar's own blurred surface (default).
   *  "tile" — carries its own rounded dark tile + border + soft glow, for use
   *  standalone against varied backgrounds (the Banner, favicon-style badges). */
  variant?: 'mark' | 'tile';
}

/**
 * The RyzzQuizz "R" mark — same artwork as public/favicon.svg, inlined so the
 * navbar doesn't wait on a network request to draw its own logo. An "R" with
 * a check worked into its counter (correct-answer motif) and a three-colour
 * confetti burst; thick round strokes so it stays legible from favicon size
 * up to banner size.
 */
export function BrandMark({ size = 26, variant = 'mark' }: Props) {
  // Each mounted instance gets its own gradient/filter ids — two BrandMarks
  // on one page (navbar + banner) would otherwise collide on a shared <defs> id.
  const id = useState(() => `brandmark-${uid++}`)[0];
  const tiled = variant === 'tile';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={`brandmark ${tiled ? 'brandmark--tile' : ''}`}
    >
      <defs>
        <linearGradient id={`${id}-r`} x1="14" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b39dff" />
          <stop offset="1" stopColor="#6244e0" />
        </linearGradient>
        {tiled && (
          <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22243f" />
            <stop offset="1" stopColor="#14152b" />
          </linearGradient>
        )}
      </defs>
      {tiled && (
        <rect width="64" height="64" rx="16" fill={`url(#${id}-tile)`} stroke="var(--border-strong)" />
      )}
      <g
        fill="none"
        stroke={`url(#${id}-r)`}
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 48V17h11.5a8.75 8.75 0 0 1 0 17.5H21" />
        <path d="M31 34.5 44 48" />
      </g>
      <path
        d="m24.5 28.5 4.5 4.5 9.5-10"
        fill="none"
        stroke="#fff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g strokeWidth="4.5" strokeLinecap="round">
        <path d="M49 17.5 52.5 13" stroke="#2ec4b6" />
        <path d="M53.5 22.5 58.5 20" stroke="#e84855" />
        <path d="M44.5 12.5 46 7" stroke="#f9a03f" />
      </g>
    </svg>
  );
}
