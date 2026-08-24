import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Ticks a number up to `value` on a rAF loop. Scores landing instantly reads as
 * a data change; scores rolling up reads as a reward, which is the whole point
 * of the results screen.
 */
export function useCountUp(value: number, durationMs = 800): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced || durationMs <= 0) {
      from.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const origin = from.current;
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Expo-out: most of the movement up front, then a slow settle.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(origin + (value - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduced]);

  return shown;
}
