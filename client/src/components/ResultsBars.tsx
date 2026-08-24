import { m } from 'motion/react';
import { OptionShape } from './OptionShape.js';
import { ease, duration } from '../lib/motion.js';
import { useCountUp } from '../lib/useCountUp.js';

/** One bar, so each row can own its own count-up hook. */
function Bar({
  option,
  count,
  max,
  index,
  correct,
}: {
  option: string;
  count: number;
  max: number;
  index: number;
  correct: boolean;
}) {
  const shown = useCountUp(count, 700);

  return (
    <li className={`bar ${correct ? 'bar--correct' : 'bar--wrong'}`}>
      <div className="bar__label">
        <span className="bar__name">
          <span className={`bar__shape option--${index}`}>
            <OptionShape index={index} />
          </span>
          {option}
          {correct && <span className="bar__tick">✓</span>}
        </span>
        <span className="bar__count">{shown}</span>
      </div>
      <div className="bar__track">
        <m.div
          className={`bar__fill option--${index}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: max > 0 ? count / max : 0 }}
          // Staggered so the bars read left-to-right as a sequence, not a jump cut.
          transition={{ duration: duration.reveal, ease: ease.out, delay: 0.12 + index * 0.08 }}
        />
      </div>
    </li>
  );
}

export function ResultsBars({
  options,
  tally,
  correctIndex,
}: {
  options: string[];
  tally: number[];
  correctIndex: number;
}) {
  const max = Math.max(1, ...tally);
  return (
    <ul className="bars">
      {options.map((opt, i) => (
        <Bar
          key={i}
          option={opt}
          count={tally[i] ?? 0}
          max={max}
          index={i}
          correct={i === correctIndex}
        />
      ))}
    </ul>
  );
}
