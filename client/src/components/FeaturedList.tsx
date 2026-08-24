import { m } from 'motion/react';
import type { QuizSummary } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';

interface Props {
  quizzes: QuizSummary[];
  onPick: (quizId: string) => void;
}

const DIFFICULTY_DOT = { easy: '🟢', medium: '🟡', hard: '🔴' } as const;

/**
 * Numbered discovery list — rank, emoji cover, title, and the real metadata we
 * actually have (question count, difficulty). Deliberately no play counts:
 * nothing tracks plays yet, and inventing "4.8K plays" would be a fake stat.
 */
export function FeaturedList({ quizzes, onPick }: Props) {
  const { t } = useI18n();

  return (
    <ol className="featlist">
      {quizzes.map((quiz, i) => (
        <m.li
          key={quiz.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: Math.min(i, 9) * 0.045, ease: [0.16, 1, 0.3, 1] }}
        >
          <m.button
            className="featrow"
            onClick={() => onPick(quiz.id)}
            whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
            whileTap={{ scale: 0.985, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
          >
            <span className="featrow__rank" aria-hidden="true">{i + 1}</span>
            <span className={`featrow__cover featrow__cover--${quiz.category}`} aria-hidden="true">
              {quiz.emoji}
            </span>
            <span className="featrow__body">
              <span className="featrow__title">{quiz.title}</span>
              {quiz.subtitle && <span className="featrow__sub">{quiz.subtitle}</span>}
              <span className="featrow__meta">
                <span>{quiz.questionCount} {t('common.questions')}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {DIFFICULTY_DOT[quiz.difficulty]} {t(`library.${quiz.difficulty}`)}
                </span>
              </span>
            </span>
            <span className="featrow__go" aria-hidden="true">▶</span>
          </m.button>
        </m.li>
      ))}
    </ol>
  );
}
