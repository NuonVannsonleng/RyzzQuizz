import { useEffect, useRef, useState } from 'react';

/**
 * Timer sync: the server sends endsAt in ITS clock, plus serverNow. We keep the
 * offset instead of trusting the local clock, so a device with a skewed clock
 * still counts down against the same deadline everyone else sees.
 */
export function useCountdown(endsAt: number | null, serverNow: number | null) {
  const offset = useRef(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (serverNow !== null) offset.current = serverNow - Date.now();
  }, [serverNow]);

  useEffect(() => {
    if (endsAt === null) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, endsAt - (Date.now() + offset.current));
      setRemaining(left);
      return left;
    };
    tick();
    const id = setInterval(() => {
      if (tick() <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  return { seconds: Math.ceil(remaining / 1000), ms: remaining };
}
