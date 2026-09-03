import { useState } from 'react';
import { CoverScene } from './CoverScene.js';

interface Props {
  coverKey: string;
  className?: string;
}

/** A real photo when one exists at /covers/<key>.jpg, falling back to the illustrated CoverScene if it 404s. */
export function CoverPhoto({ coverKey, className }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <CoverScene slug={coverKey} />;
  return (
    <img
      className={className}
      src={`/covers/${coverKey}.jpg`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
