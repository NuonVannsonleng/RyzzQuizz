import { AnimatePresence, m } from 'motion/react';
import { OptionShape, SHAPE_NAMES } from './OptionShape.js';
import { spring } from '../lib/motion.js';

interface Props {
  options: string[];
  picked: number | null;
  disabled: boolean;
  onPick: (index: number) => void;
  /** Set once results are in, so tiles can reveal right/wrong. */
  correctIndex?: number | null;
}

/**
 * Tiles cascade in on a 60ms stagger — fast enough that nobody waits, slow
 * enough that the four options register as four separate choices.
 */
export function AnswerGrid({ options, picked, disabled, onPick, correctIndex }: Props) {
  const revealed = correctIndex != null;

  return (
    <div className="options options--play">
      {options.map((opt, i) => {
        const isPicked = picked === i;
        const isCorrect = revealed && i === correctIndex;
        const dimmed = revealed ? !isCorrect : picked !== null && !isPicked;

        return (
          <m.button
            key={i}
            className={`option option--${i} ${isPicked ? 'is-picked' : ''} ${
              dimmed ? 'is-dimmed' : ''
            } ${isCorrect ? 'is-correct' : ''}`}
            disabled={disabled || picked !== null}
            onClick={() => onPick(i)}
            aria-label={`${SHAPE_NAMES[i % SHAPE_NAMES.length]}: ${opt}`}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{
              opacity: dimmed ? 0.35 : 1,
              y: 0,
              scale: isPicked ? 1.03 : 1,
            }}
            // The 0.06*i stagger is an entrance effect only — `transition` reapplies
            // to every `animate` change, so without this guard, picking an answer
            // (which flips `dimmed`/`isPicked` on all four tiles) replayed the same
            // cascade instead of responding immediately.
            transition={{ ...spring.pop, delay: picked === null && !revealed ? 0.06 * i : 0 }}
            // whileHover/whileTap inherit `transition` unless given their own — without
            // this override, hovering tile i also inherited its 0.06*i entrance delay,
            // so the hover scale visibly lagged more the further right/down the tile was.
            whileHover={picked === null && !disabled ? { scale: 1.02, transition: spring.pop } : undefined}
            whileTap={picked === null && !disabled ? { scale: 0.97, transition: spring.pop } : undefined}
          >
            <OptionShape index={i} />
            <span className="option__text">{opt}</span>
            <AnimatePresence>
              {isCorrect && (
                <m.span
                  className="option__badge"
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={spring.pop}
                >
                  ✓
                </m.span>
              )}
            </AnimatePresence>
          </m.button>
        );
      })}
    </div>
  );
}
