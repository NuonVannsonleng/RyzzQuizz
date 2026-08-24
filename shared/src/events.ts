// WebSocket event contract — single source of truth for host + player clients.
// Adding an event means adding it here first, then wiring both sides.

import type {
  LeaderboardEntry,
  Player,
  PlayerAvatar,
  PublicQuestion,
  QuestionResults,
  Quiz,
  RoomState,
} from './domain.js';

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** How a dev-mode bot picks and times its answer. 'mixed' round-robins the rest across the bot roster. */
export type BotPreset = 'perfect' | 'beginner' | 'fast' | 'slow' | 'random' | 'timeout' | 'mixed';

/** Snapshot every client receives on join/reconnect. Role-filtered server-side. */
export interface RoomSnapshot {
  code: string;
  state: RoomState;
  quizTitle: string;
  quizSubtitle?: string;
  quizEmoji: string;
  questionCount: number;
  players: Player[];
  question: PublicQuestion | null;
  /** Epoch ms the current question closes; pair with serverNow to sync timers. */
  questionEndsAt: number | null;
  serverNow: number;
  results: QuestionResults | null;
  /** Set for players so a reconnect restores their locked-in answer. */
  yourPlayerId?: string;
  yourAnswerIndex?: number | null;
}

// Client -> Server

export interface ClientToServerEvents {
  /**
   * quizId picks from the server catalog; quiz uploads an ad-hoc one.
   * hostToken is returned once here; the host persists it to survive a refresh.
   */
  'host:create': (
    payload: { quizId?: string; quiz?: Quiz },
    ack: (res: Ack<RoomSnapshot & { hostToken: string }>) => void,
  ) => void;
  'host:resume': (payload: { code: string; hostToken: string }, ack: (res: Ack<RoomSnapshot>) => void) => void;
  'host:start': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  'host:next': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  'host:skip': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  'host:end': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;
  /** Immediately closes the room and notifies any connected players — used when the host is done reviewing results and starts a new game. */
  'host:exit': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;

  'player:join': (
    payload: { code: string; nickname: string; playerId?: string; avatar?: Partial<PlayerAvatar> },
    ack: (res: Ack<RoomSnapshot & { playerId: string }>) => void,
  ) => void;
  'player:answer': (
    payload: { optionIndex: number },
    ack: (res: Ack<{ accepted: boolean }>) => void,
  ) => void;
  'player:leave': (payload: Record<string, never>, ack: (res: Ack<null>) => void) => void;

  /**
   * Adds simulated players to the room the caller is hosting, for local
   * testing. The server rejects this outright unless dev tools are enabled
   * (see GET /api/dev/status) — never gated on the client alone.
   */
  'dev:addBots': (
    payload: { count: number; preset: BotPreset },
    ack: (res: Ack<null>) => void,
  ) => void;
}

// Server -> Client

export interface ServerToClientEvents {
  'room:state': (snapshot: RoomSnapshot) => void;
  'room:players': (payload: { players: Player[] }) => void;
  'room:closed': (payload: { reason: string }) => void;

  'question:start': (payload: {
    question: PublicQuestion;
    endsAt: number;
    serverNow: number;
  }) => void;
  /** Live count only — never the tally, or players could infer the answer. */
  'question:answered': (payload: { answeredCount: number; playerCount: number }) => void;
  'question:results': (payload: QuestionResults) => void;

  'game:over': (payload: { leaderboard: LeaderboardEntry[] }) => void;
  'error:msg': (payload: { message: string }) => void;
}

export const ROOM_CODE_LENGTH = 6;
export const MAX_NICKNAME_LENGTH = 16;
export const MAX_PLAYERS = 100;
