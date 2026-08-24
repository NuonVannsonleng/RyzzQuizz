import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { spring } from '../lib/motion.js';
import { celebrateCorrect } from '../lib/celebrate.js';
import { useCountUp } from '../lib/useCountUp.js';
import { useI18n } from '../i18n/index.js';
import { sfxCorrect, sfxIncorrect } from '../lib/sfx.js';

interface Props {
  correct: boolean | null;
  points: number;
  streak: number;
}

/** The beat between answering and the leaderboard: colour, icon, then points. */
export function Verdict({ correct, points, streak }: Props) {
  const { t } = useI18n();
  const shownPoints = useCountUp(points, 900);
  const fired = useRef(false);

  // Verdict remounts fresh each results phase (parent keys on results.index),
  // so this is a genuine mount-once effect — but React 18 StrictMode replays
  // effects once in dev (mount → cleanup → mount) to surface missing cleanup,
  // which would otherwise double the confetti burst and the beep every time.
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (correct) {
      celebrateCorrect();
      sfxCorrect();
    } else if (correct === false) {
      sfxIncorrect();
    }
  }, [correct]);

  const tone = correct === null ? 'none' : correct ? 'good' : 'bad';
  const heading = correct === null ? t('play.noAnswer') : correct ? t('play.correct') : t('play.notQuite');

  return (
    <m.div
      className={`verdictcard verdictcard--${tone}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring.pop}
    >
      <m.div
        className="verdictcard__icon"
        initial={{ scale: 0, rotate: correct ? -30 : 30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...spring.pop, delay: 0.1 }}
      >
        {correct === null ? '⏳' : correct ? '✓' : '✕'}
      </m.div>

      <m.h2
        className="verdictcard__title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        {heading}
      </m.h2>

      {correct && (
        <m.p
          className="verdictcard__points"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.pop, delay: 0.3 }}
        >
          +{shownPoints}
        </m.p>
      )}

      {correct && streak > 1 && (
        <m.p
          className="verdictcard__streak"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.pop, delay: 0.42 }}
        >
          🔥 {t('play.streak', { n: streak })}
        </m.p>
      )}
    </m.div>
  );
}
