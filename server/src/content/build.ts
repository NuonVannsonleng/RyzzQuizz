import type { Difficulty, Question, Quiz, QuizCategory } from '@ryzzquizz/shared';
import { gradeLabelKh, subjectMeta } from '@ryzzquizz/shared';

// Builders for the static catalog. Ids are deterministic slugs, not UUIDs —
// the client picks a quiz by id, so it has to survive a server restart.

export interface Seed {
  text: string;
  options: string[];
  correctIndex: number;
  timeLimitSec?: number;
  image?: string;
}

export function q(
  text: string,
  options: string[],
  correctIndex: number,
  timeLimitSec?: number,
): Seed {
  return { text, options, correctIndex, timeLimitSec };
}

/**
 * flagcdn.com — a free, public, license-free CDN of official country flags
 * keyed by ISO 3166-1 alpha-2 code. Used instead of flag emoji because
 * Windows' emoji font renders regional-indicator flags as their two-letter
 * code ("KH") rather than an actual flag glyph.
 */
export function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w320/${iso2.toLowerCase()}.png`;
}

/** Same as `q`, plus a big image (emoji or https:// URL) shown above the question — flags, portraits, landmarks. */
export function qi(
  text: string,
  image: string,
  options: string[],
  correctIndex: number,
  timeLimitSec?: number,
): Seed {
  return { text, options, correctIndex, timeLimitSec, image };
}

function materialize(quizId: string, seeds: Seed[], fallbackTime: number): Question[] {
  return seeds.map((s, i) => ({
    id: `${quizId}-q${i + 1}`,
    text: s.text,
    options: s.options,
    correctIndex: s.correctIndex,
    timeLimitSec: s.timeLimitSec ?? fallbackTime,
    image: s.image,
  }));
}

/** Primary=easy, lower secondary=medium, upper secondary=hard — mirrors GRADE_BANDS in shared/catalog.ts. */
function difficultyForGrade(grade: number): Difficulty {
  if (grade <= 6) return 'easy';
  if (grade <= 9) return 'medium';
  return 'hard';
}

/** Curriculum quiz — title, subtitle, and difficulty are derived from grade + subject. */
export function eduQuiz(grade: number, subject: string, seeds: Seed[], timeLimitSec = 25): Quiz {
  const meta = subjectMeta(subject);
  if (!meta) throw new Error(`Unknown subject: ${subject}`);
  const id = `kh-g${grade}-${subject}`;
  return {
    id,
    title: `${gradeLabelKh(grade)} · ${meta.kh}`,
    subtitle: `Grade ${grade} · ${meta.en}`,
    category: 'education',
    grade,
    subject,
    emoji: meta.emoji,
    difficulty: difficultyForGrade(grade),
    questions: materialize(id, seeds, timeLimitSec),
  };
}

/**
 * Fun-category quiz — free-form title, no grade or subject. `difficulty` is
 * required (not defaulted) so every quiz gets a deliberate rating instead of
 * silently inheriting whatever the default happened to be.
 */
export function funQuiz(
  id: string,
  title: string,
  subtitle: string,
  category: QuizCategory,
  emoji: string,
  seeds: Seed[],
  timeLimitSec: number,
  difficulty: Difficulty,
): Quiz {
  return {
    id,
    title,
    subtitle,
    category,
    emoji,
    difficulty,
    questions: materialize(id, seeds, timeLimitSec),
  };
}

/** Catches option/answer typos at boot instead of mid-game. */
export function validate(quizzes: Quiz[]): Quiz[] {
  const seen = new Set<string>();
  for (const quiz of quizzes) {
    if (seen.has(quiz.id)) throw new Error(`Duplicate quiz id: ${quiz.id}`);
    seen.add(quiz.id);
    if (quiz.questions.length === 0) throw new Error(`Quiz has no questions: ${quiz.id}`);
    for (const question of quiz.questions) {
      if (question.options.length < 2 || question.options.length > 4) {
        throw new Error(`${question.id}: needs 2–4 options, got ${question.options.length}`);
      }
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
        throw new Error(`${question.id}: correctIndex ${question.correctIndex} out of range`);
      }
      if (new Set(question.options).size !== question.options.length) {
        throw new Error(`${question.id}: duplicate options`);
      }
      if (question.image?.startsWith('http') && !question.image.startsWith('https://')) {
        throw new Error(`${question.id}: image URLs must be https://`);
      }
    }
  }
  return quizzes;
}
