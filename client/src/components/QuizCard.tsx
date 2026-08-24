import { m } from 'motion/react';
import type { QuizSummary } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';

interface Props {
  quiz: QuizSummary;
  index: number;
  picking: boolean;
  disabled: boolean;
  onPick: (quizId: string) => void;
}

const DIFFICULTY_DOT = { easy: '🟢', medium: '🟡', hard: '🔴' } as const;

/** One tile in the library grid — staggers in on mount, lifts on hover, shows a busy state while its room is being created. */
export function QuizCard({ quiz, index, picking, disabled, onPick }: Props) {
  const { t } = useI18n();

  return (
    <m.li
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 10) * 0.035, ease: [0.16, 1, 0.3, 1] }}
    >
      <m.button
        className={`quizcard ${picking ? 'is-picking' : ''}`}
        disabled={disabled}
        onClick={() => onPick(quiz.id)}
        whileHover={disabled ? undefined : { y: -4 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <span className={`quizcard__cover quizcard__cover--${quiz.category}`}>
          <span className="quizcard__emoji" aria-hidden="true">
            {quiz.emoji}
          </span>
          <span className="quizcard__badges">
            {quiz.grade && <span className="quizcard__grade">{quiz.grade}</span>}
            <span className={`quizcard__difficulty quizcard__difficulty--${quiz.difficulty}`}>
              <span aria-hidden="true">{DIFFICULTY_DOT[quiz.difficulty]}</span>
              {t(`library.${quiz.difficulty}`)}
            </span>
          </span>
        </span>
        <span className="quizcard__body">
          <span className="quizcard__title">{quiz.title}</span>
          {quiz.subtitle && <span className="quizcard__sub">{quiz.subtitle}</span>}
        </span>
        <span className="quizcard__foot">
          <span className="quizcard__count">
            {quiz.questionCount} {t('common.questions')}
          </span>
          <span className={`quizcard__cta ${picking ? 'is-busy' : ''}`}>
            {picking ? <span className="btn__spinner" aria-hidden="true" /> : t('library.hostThis')}
          </span>
        </span>
      </m.button>
    </m.li>
  );
}
