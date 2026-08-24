/**
 * The RyzzQuizz "R" mark — same artwork as public/favicon.svg, inlined so the
 * navbar doesn't wait on a network request to draw its own logo. Transparent
 * background (unlike the favicon, which needs its own dark tile).
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className="brandmark"
    >
      <defs>
        <linearGradient id="brandmark-r" x1="14" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b39dff" />
          <stop offset="1" stopColor="#6244e0" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#brandmark-r)"
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
