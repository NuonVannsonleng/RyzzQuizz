// Kahoot's answer language: each option index owns a colour AND a shape, so
// players can call out "the triangle" and colour-blind players still have a
// non-colour cue. Order matches the --o0..--o3 custom properties.

const PATHS = [
  'M12 3 L22 20 L2 20 Z', // triangle
  'M12 2 L22 12 L12 22 L2 12 Z', // diamond
  'M12 12 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0', // circle
  'M3 3 H21 V21 H3 Z', // square
] as const;

export const SHAPE_NAMES = ['Triangle', 'Diamond', 'Circle', 'Square'] as const;

export function OptionShape({ index }: { index: number }) {
  return (
    <svg className="shape" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[index % PATHS.length]} />
    </svg>
  );
}
