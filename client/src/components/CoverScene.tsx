// Same four shapes as OptionShape (triangle/diamond/circle/square) reused
// here as background texture, so the whole app draws from one visual
// vocabulary instead of inventing a new motif just for quiz covers.
const SHAPES = [
  'M12 3 L22 20 L2 20 Z',
  'M12 2 L22 12 L12 22 L2 12 Z',
  'M12 12 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',
  'M3 3 H21 V21 H3 Z',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The composed backdrop behind a quiz cover's icon — two oversized, rotated
 * shapes bleeding off the edges, plus a small sparkle. Placement is derived
 * from the slug (not random), so a given subject always renders the same
 * way rather than reshuffling on every mount.
 */
export function CoverScene({ slug }: { slug: string }) {
  const h = hash(slug);
  const shapeA = SHAPES[h % 4];
  const shapeB = SHAPES[(h >> 4) % 4];
  const rotA = (h % 50) - 10;
  const rotB = ((h >> 6) % 50) - 10;

  return (
    <svg className="coverscene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={shapeA} fill="#fff" opacity="0.1" transform={`translate(68 -8) scale(2.9) rotate(${rotA} 12 12)`} />
      <path d={shapeB} fill="#fff" opacity="0.08" transform={`translate(90 44) scale(2.3) rotate(${rotB} 12 12)`} />
      <circle cx="86" cy="16" r="2.1" fill="#fff" opacity="0.5" />
      <circle cx="93" cy="27" r="1.3" fill="#fff" opacity="0.4" />
    </svg>
  );
}
