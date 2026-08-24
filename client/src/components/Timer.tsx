import { useEffect } from 'react';
import { m } from 'motion/react';
import { spring } from '../lib/motion.js';
import { useI18n } from '../i18n/index.js';
import { sfxCountdownUrgent } from '../lib/sfx.js';

const R = 26;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Ring drains anticlockwise as the clock runs down. The number re-keys on each
 * whole second so it pops — the ring carries continuity, the digit carries urgency.
 */
export function Timer({ seconds, ms, total }: { seconds: number; ms: number; total: number }) {
  const { t } = useI18n();
  // Ring drains off continuous ms, not the ceil'd `seconds` digit below it —
  // otherwise it visibly steps once per second instead of draining smoothly.
  const pct = total > 0 ? Math.max(0, Math.min(1, ms / (total * 1000))) : 0;
  const urgent = seconds <= 5 && seconds > 0;

  // seconds only changes value once per whole second (it's a ceil() over a
  // 100ms-tick ms countdown), so this fires exactly once per urgent tick.
  useEffect(() => {
    if (urgent) sfxCountdownUrgent();
  }, [seconds, urgent]);

  return (
    <div className={`timer ${urgent ? 'timer--urgent' : ''}`} role="timer" aria-live="off">
      <svg className="timer__ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="timer__ring-track" cx="32" cy="32" r={R} />
        <circle
          className="timer__ring-fill"
          cx="32"
          cy="32"
          r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
        />
      </svg>
      <m.span
        key={seconds}
        className="timer__value"
        initial={{ scale: urgent ? 1.45 : 1.15, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.pop}
      >
        {seconds}
      </m.span>
      <span className="sr-only">{t('a11y.secondsLeft', { n: seconds })}</span>
    </div>
  );
}
