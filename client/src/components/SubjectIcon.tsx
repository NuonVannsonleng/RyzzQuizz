import type { SVGProps } from 'react';

// One hand-drawn glyph per subject/category slug, replacing the raw emoji
// covers used to render. Stroke-based (Lucide-style grid), single colour via
// currentColor so it inherits whatever the cover sets — no per-icon palette
// to keep in sync with --cardhue/--collhue.

type IconBody = () => JSX.Element;

const ICONS: Record<string, IconBody> = {
  // School subjects
  khmer: () => (
    <>
      <path d="M3 5.5C4.5 4.5 7 4 9 4.5v14c-2-.5-4.5 0-6 1V5.5Z" />
      <path d="M21 5.5C19.5 4.5 17 4 15 4.5v14c2-.5 4.5 0 6 1V5.5Z" />
    </>
  ),
  math: () => (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8 6h8" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  science: () => (
    <>
      <circle cx="12" cy="6.5" r="2.3" />
      <path d="M12 8.8 8 19h8L12 8.8Z" />
      <path d="M5 19h14" />
      <path d="M9 14.2h6" />
    </>
  ),
  social: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  physics: () => (
    <>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(120 12 12)" />
    </>
  ),
  chemistry: () => (
    <>
      <path d="M9.5 2h5" />
      <path d="M10.5 2v8L5.8 18a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3L13.5 10V2" />
      <path d="M7.3 15h9.4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  biology: () => (
    <>
      <path d="M6.5 3c0 5.5 11 5.5 11 9s-11 3.5-11 9" />
      <path d="M17.5 3c0 5.5-11 5.5-11 9s11 3.5 11 9" />
      <path d="M7.5 7.3h9" />
      <path d="M7.5 16.7h9" />
    </>
  ),
  history: () => (
    <>
      <path d="M2 9 12 3l10 6" />
      <rect x="2" y="9" width="20" height="2" rx="1" fill="currentColor" stroke="none" />
      <path d="M5 11v8" />
      <path d="M9.5 11v8" />
      <path d="M14.5 11v8" />
      <path d="M19 11v8" />
      <path d="M3 21h18" />
    </>
  ),
  geography: () => (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  english: () => (
    <text x="12" y="17.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor" stroke="none">
      Aa
    </text>
  ),

  // Fun categories
  education: () => (
    <>
      <path d="M2 9 12 4.5 22 9l-10 4.5L2 9Z" />
      <path d="M6.5 11.2v4.6c0 1.6 2.7 3.2 5.5 3.2s5.5-1.6 5.5-3.2v-4.6" />
      <path d="M22 9v6" />
    </>
  ),
  people: () => (
    <path
      d="m12 2.5 2.9 6 6.6.6-5 4.4 1.5 6.4L12 16.5 6 19.9l1.5-6.4-5-4.4 6.6-.6 2.9-6Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  // "Country Guess" — distinct from the geography *subject*'s folded-map icon.
  'country-guess': () => (
    <>
      <path d="M12 22s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  entertainment: () => (
    <>
      <path d="M3 9.5h18l-1.2 10.5H4.2L3 9.5Z" />
      <path d="m3.3 9.5 1.5-4.5h4.2L7.5 9.5" />
      <path d="m10.4 9.5 1.5-4.5h4.2l-1.6 4.5" />
      <path d="m17.5 9.5 1.5-4.5h2.8L20.5 9.5" />
    </>
  ),
  sports: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c3.2 3.2 3.2 14.8 0 18" />
      <path d="M3 12h18" />
      <path d="M5.2 6.6c3.2 3 10.4 3 13.6 0" />
      <path d="M5.2 17.4c3.2-3 10.4-3 13.6 0" />
    </>
  ),
  culture: () => (
    <>
      <path d="M12 2 14.2 6.3H9.8L12 2Z" fill="currentColor" stroke="none" />
      <path d="M5.5 7.6 7 10.5H4L5.5 7.6Z" fill="currentColor" stroke="none" />
      <path d="M18.5 7.6 20 10.5h-3l1.5-2.9Z" fill="currentColor" stroke="none" />
      <path d="M3 21v-7.3A2.7 2.7 0 0 1 5.7 11h1a2.7 2.7 0 0 1 2.7 2.7V15h5v-1.3A2.7 2.7 0 0 1 17.1 11h1a2.7 2.7 0 0 1 2.7 2.7V21" />
      <path d="M10 21v-4.5a2 2 0 0 1 4 0V21" />
      <path d="M3 21h18" />
    </>
  ),
  general: () => (
    <>
      <path d="M9 18h6" />
      <path d="M10 21.5h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
    </>
  ),
};

interface Props extends SVGProps<SVGSVGElement> {
  slug: string;
  size?: number;
}

/** Falls back to a plain dot if a slug has no mark yet — never a broken render. */
export function SubjectIcon({ slug, size = 32, className, ...rest }: Props) {
  const Body = ICONS[slug];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {Body ? <Body /> : <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />}
    </svg>
  );
}
