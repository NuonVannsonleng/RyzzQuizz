import type { Difficulty, Quiz, QuizCategory, QuizSummary } from '@ryzzquizz/shared';
import { CATALOG } from '../content/index.js';

// Stand-in for the quizzes/questions tables until they're wired to Postgres.
// Swapping this for real queries should not touch roomService.

const quizzes = new Map<string, Quiz>(CATALOG.map((quiz) => [quiz.id, quiz]));

/** Fallback when a host starts a room without picking anything. */
export const DEFAULT_QUIZ: Quiz = quizzes.get('khmer-culture') ?? CATALOG[0];

export interface QuizFilter {
  category?: string;
  grade?: number;
  subject?: string;
  difficulty?: string;
  search?: string;
}

export function toSummary(quiz: Quiz): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    subtitle: quiz.subtitle,
    category: quiz.category,
    grade: quiz.grade,
    subject: quiz.subject,
    emoji: quiz.emoji,
    difficulty: quiz.difficulty,
    questionCount: quiz.questions.length,
  };
}

export function getQuiz(id: string): Quiz | undefined {
  return quizzes.get(id);
}

export function saveQuiz(quiz: Quiz): Quiz {
  quizzes.set(quiz.id, quiz);
  return quiz;
}

export function listQuizzes(filter: QuizFilter = {}): QuizSummary[] {
  const needle = filter.search?.trim().toLowerCase();
  return CATALOG.filter((quiz) => {
    if (filter.category && quiz.category !== filter.category) return false;
    if (filter.grade !== undefined && quiz.grade !== filter.grade) return false;
    if (filter.subject && quiz.subject !== filter.subject) return false;
    if (filter.difficulty && quiz.difficulty !== filter.difficulty) return false;
    if (needle) {
      const haystack = `${quiz.title} ${quiz.subtitle ?? ''} ${quiz.subject ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }).map(toSummary);
}

/** Counts per shelf so the picker can show badges without fetching every quiz. */
export function catalogStats(): {
  total: number;
  questions: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<Difficulty, number>;
  grades: number[];
} {
  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const grades = new Set<number>();
  let questions = 0;

  for (const quiz of CATALOG) {
    byCategory[quiz.category] = (byCategory[quiz.category] ?? 0) + 1;
    byDifficulty[quiz.difficulty] += 1;
    if (quiz.grade) grades.add(quiz.grade);
    questions += quiz.questions.length;
  }

  return {
    total: CATALOG.length,
    questions,
    byCategory,
    byDifficulty,
    grades: [...grades].sort((a, b) => a - b),
  };
}

export function subjectsForGrade(grade: number): string[] {
  return [
    ...new Set(
      CATALOG.filter((quiz) => quiz.grade === grade && quiz.subject).map((quiz) => quiz.subject!),
    ),
  ];
}

export type { QuizCategory };
