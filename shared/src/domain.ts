// Core domain model — mirrors server/src/db/schema.sql

export type RoomState = 'lobby' | 'question' | 'results' | 'ended';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimitSec: number;
  /** Big media shown above the question — an emoji (flags, portraits-by-proxy) or an https:// image URL. */
  image?: string;
}

/** Top-level shelf in the quiz library. */
export type QuizCategory =
  | 'education'
  | 'geography'
  | 'people'
  | 'entertainment'
  | 'sports'
  | 'culture'
  | 'general';

/**
 * Curriculum quizzes derive this from grade band (primary=easy, lower
 * secondary=medium, upper secondary=hard); fun-category quizzes set it
 * explicitly per quiz. See server/src/content/build.ts.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Quiz {
  id: string;
  /** Display title — Khmer for curriculum quizzes. */
  title: string;
  /** English gloss shown under the title. */
  subtitle?: string;
  category: QuizCategory;
  /** 1–12 for MoEYS curriculum quizzes; absent for the fun categories. */
  grade?: number;
  /** Subject slug, see shared SUBJECTS table. */
  subject?: string;
  emoji: string;
  difficulty: Difficulty;
  questions: Question[];
}

/** Catalog row — everything the picker needs, minus the answers. */
export interface QuizSummary {
  id: string;
  title: string;
  subtitle?: string;
  category: QuizCategory;
  grade?: number;
  subject?: string;
  emoji: string;
  difficulty: Difficulty;
  questionCount: number;
}

/**
 * Cosmetic-only — never affects scoring. `shirt`/`accessory` are shop item ids
 * or `'none'`; `base`/`color` are always free. See shared/src/shop.ts.
 */
export interface PlayerAvatar {
  base: string;
  color: string;
  shirt: string;
  accessory: string;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  connected: boolean;
  avatar: PlayerAvatar;
  /** Set for dev-mode simulated players so the UI can tag them. Never set for real players. */
  isBot?: boolean;
}

export interface Answer {
  playerId: string;
  questionIndex: number;
  optionIndex: number;
  answeredAt: number;
  correct: boolean;
  pointsAwarded: number;
}

export interface Room {
  code: string;
  hostId: string;
  quiz: Quiz;
  players: Map<string, Player>;
  state: RoomState;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionEndsAt: number | null;
  answers: Answer[];
  createdAt: number;
}

// Wire-safe views (never leak correctIndex to players mid-question)

export interface PublicQuestion {
  index: number;
  total: number;
  text: string;
  options: string[];
  timeLimitSec: number;
  image?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  avatar: PlayerAvatar;
  isBot?: boolean;
}

export interface QuestionResults {
  index: number;
  correctIndex: number;
  tally: number[];
  leaderboard: LeaderboardEntry[];
  yourAnswer?: { optionIndex: number; correct: boolean; pointsAwarded: number };
}
