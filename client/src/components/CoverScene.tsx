// Small props scattered per subject/category — literal, not abstract, so a
// Math cover actually shows numbers and operators, Science shows a molecule
// and a bubble, and so on. Paths are on a local 0-24 grid, placed via
// translate+scale; `text` entries are ready-made glyphs (digits, operators,
// letters) where a symbol says it better than a drawn shape would.
//
// Kept inside x:35-97 / y:38-96 — clear of the icon badge (top-left) and the
// grade/difficulty pills (top-right) so nothing gets buried behind them.
interface Prop {
  d?: string;
  text?: string;
  /** Radius, for a plain circle prop — simpler and more reliable than an arc-path hack. */
  r?: number;
  x: number;
  y: number;
  size: number;
  rotate?: number;
  opacity?: number;
}

const PROPS: Record<string, Prop[]> = {
  // Subjects
  khmer: [
    { d: 'M0 1h15M0 6h11M0 11h13', x: 40, y: 50, size: 1.7, opacity: 0.5 },
    { d: 'm2 20 12-14 3 3-12 14-4 1 1-4Z', x: 78, y: 74, size: 1.3, rotate: 10, opacity: 0.4 },
  ],
  math: [
    { text: '+', x: 50, y: 68, size: 28, opacity: 0.55 },
    { text: '9', x: 82, y: 84, size: 20, opacity: 0.4 },
  ],
  science: [
    { d: 'M2 12 12 4l10 8M12 4v10', x: 42, y: 50, size: 1.3, opacity: 0.5 },
    { r: 3, x: 84, y: 80, size: 1, opacity: 0.42 },
  ],
  social: [
    { d: 'M11 2C6 2 2 6 2 11c0 7 9 13 9 13s9-6 9-13c0-5-4-9-9-9Zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z', x: 44, y: 46, size: 1.1, opacity: 0.5 },
    { d: 'M0 6c8 5 20 5 28 0', x: 74, y: 86, size: 1, opacity: 0.36 },
  ],
  physics: [
    { d: 'M13 2 4 14h6l-2 8 11-13h-7l1-7Z', x: 44, y: 48, size: 1.1, opacity: 0.52 },
    { d: 'M11 11m-10 0a10 4 0 1 0 20 0a10 4 0 1 0 -20 0', x: 76, y: 84, size: 1.1, rotate: -15, opacity: 0.36 },
  ],
  chemistry: [
    { d: 'M8 1h7M9.5 1v7L4 19a2 2 0 0 0 1.7 3h9.6a2 2 0 0 0 1.7-3L11.5 8V1', x: 42, y: 44, size: 1.1, opacity: 0.5 },
    { r: 2.6, x: 82, y: 82, size: 1, opacity: 0.42 },
  ],
  biology: [
    { d: 'M0 14C0 6 6 0 14 0c0 8-6 14-14 14Z', x: 42, y: 48, size: 1.1, opacity: 0.5, rotate: -12 },
    { d: 'M0 2h14M0 8h14', x: 78, y: 82, size: 1, opacity: 0.36 },
  ],
  history: [
    { d: 'M2 20V8M9 20V8M16 20V8M0 8l10-6 10 6', x: 42, y: 44, size: 1, opacity: 0.5 },
    { d: 'M0 0c4 0 6 3 6 7s-2 7-6 7c-4 0-6-3-6-7S-4 0 0 0Z', x: 80, y: 82, size: 0.7, opacity: 0.34 },
  ],
  geography: [
    { d: 'M0 16 6 4l4 6 3-4 7 14Z', x: 40, y: 48, size: 1.1, opacity: 0.5 },
    { d: 'M8 0 10 7 17 8 10 9 8 16 6 9 -1 8 6 7Z', x: 80, y: 82, size: 0.75, opacity: 0.4, rotate: 10 },
  ],
  english: [
    { text: 'A', x: 46, y: 66, size: 30, opacity: 0.5 },
    { text: '?', x: 82, y: 84, size: 20, opacity: 0.4 },
  ],

  // Fun categories
  education: [
    { text: '★', x: 48, y: 62, size: 22, opacity: 0.5 },
    { text: '★', x: 82, y: 84, size: 13, opacity: 0.36 },
  ],
  people: [
    { text: '✦', x: 46, y: 62, size: 24, opacity: 0.52 },
    { text: '✦', x: 82, y: 84, size: 14, opacity: 0.36 },
  ],
  'country-guess': [
    { d: 'M0 16 6 4l4 6 3-4 7 14Z', x: 44, y: 48, size: 1, opacity: 0.5 },
    { r: 5, x: 82, y: 82, size: 1, opacity: 0.32 },
  ],
  entertainment: [
    { d: 'M0 20V8a2 2 0 0 1 2-2h2l3-5h9l-3 5h4l3-5h5l-3 5h2a2 2 0 0 1 2 2v12Z', x: 40, y: 44, size: 0.9, opacity: 0.5 },
    { d: 'M6 2 0 22h12L6 2Z', x: 80, y: 82, size: 0.65, opacity: 0.38, rotate: -6 },
  ],
  sports: [
    { d: 'M4 0h16v3a8 9 0 0 1-8 9 8 9 0 0 1-8-9V0Zm2 2v1a6 7 0 0 0 6 7 6 7 0 0 0 6-7V2M11 12v6m-4 4h8', x: 42, y: 42, size: 0.85, opacity: 0.5 },
    { d: 'M0 6c6-6 14-6 20 0', x: 76, y: 86, size: 1.1, opacity: 0.36 },
  ],
  culture: [
    { d: 'M9 0a9 9 0 0 0 9 9 9 9 0 0 0-9 9 9 9 0 0 0-9-9A9 9 0 0 0 9 0Z', x: 44, y: 48, size: 0.75, opacity: 0.5 },
    { d: 'M8 16c0-5 3-8 3-8s3 3 3 8a3 3 0 0 1-6 0Z', x: 80, y: 82, size: 0.75, opacity: 0.38 },
  ],
  general: [
    { text: '?', x: 48, y: 66, size: 28, opacity: 0.5 },
    { d: 'M0 6h5M2 0v5M9 9l3 3', x: 82, y: 78, size: 1.1, opacity: 0.38 },
  ],
};

/**
 * The composed backdrop behind a quiz cover's icon — two small props specific
 * to that subject (numbers for Math, a molecule for Science, a temple accent
 * for Khmer Culture...) instead of generic shapes.
 */
// The cover is ~3.2:1 (wide, short) but x/y in the table above are authored
// as a simple 0-100 grid for readability. Stretching a square viewBox to fill
// that box would squash every path and letter sideways, so the viewBox itself
// is widened to the real aspect ratio and only x gets the matching stretch —
// y stays 1:1, everything drawn keeps its true proportions.
const X_STRETCH = 3.2;

export function CoverScene({ slug }: { slug: string }) {
  const props = PROPS[slug];
  if (!props) return null;

  return (
    <svg
      className="coverscene"
      width="100%"
      height="100%"
      viewBox={`0 0 ${100 * X_STRETCH} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {props.map((p, i) => {
        const x = p.x * X_STRETCH;
        if (p.text) {
          return (
            <text
              key={i}
              x={x}
              y={p.y}
              textAnchor="middle"
              fontSize={p.size}
              fontWeight={800}
              fill="#fff"
              opacity={p.opacity ?? 0.4}
              transform={p.rotate ? `rotate(${p.rotate} ${x} ${p.y})` : undefined}
            >
              {p.text}
            </text>
          );
        }
        if (p.r) {
          return <circle key={i} cx={x} cy={p.y} r={p.r} fill="#fff" opacity={p.opacity ?? 0.4} />;
        }
        return (
          <path
            key={i}
            d={p.d}
            fill="#fff"
            opacity={p.opacity ?? 0.4}
            transform={`translate(${x} ${p.y}) scale(${p.size}) rotate(${p.rotate ?? 0} 6 6)`}
          />
        );
      })}
    </svg>
  );
}
