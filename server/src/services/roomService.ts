import { randomUUID } from 'node:crypto';
import {
  MAX_NICKNAME_LENGTH,
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  sanitizeAvatar,
  type Answer,
  type BotPreset,
  type LeaderboardEntry,
  type Player,
  type PlayerAvatar,
  type PublicQuestion,
  type Question,
  type QuestionResults,
  type Quiz,
  type Room,
  type RoomSnapshot,
} from '@ryzzquizz/shared';
import { scoreAnswer } from './scoringService.js';

export interface ServerRoom extends Room {
  hostToken: string;
  timer: NodeJS.Timeout | null;
  /** Grace timers for disconnected players, keyed by playerId. */
  reapers: Map<string, NodeJS.Timeout>;
  /** Set by endGame(); lets housekeeping sweep finished rooms even while players are still watching the podium. */
  endedAt: number | null;
  /** Dev-mode simulated players (playerId -> behavior), see botService.ts. Empty for real games. */
  bots: Map<string, BotPreset>;
  /** Scheduled bot answer timers for the live question, cleared alongside the question timer. */
  botTimers: NodeJS.Timeout[];
}

const rooms = new Map<string, ServerRoom>();

// Ambiguous glyphs (0/O, 1/I) removed — codes get read aloud and typed by hand.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const EMPTY_ROOM_TTL_MS = 30 * 60 * 1000;
const DISCONNECT_GRACE_MS = 45 * 1000;
// Long enough to read the podium and final standings; short enough that a
// host who just closes the tab doesn't leak the room for the full 30 minutes.
const ENDED_ROOM_TTL_MS = 15 * 60 * 1000;

export class RoomError extends Error {}

function generateCode(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new RoomError('Could not allocate a room code');
}

/**
 * Per-room copy with each question's options shuffled. Two reasons: a quiz
 * plays differently every game, and nobody can learn "the answer is usually B"
 * from a catalog that was hand-written option by option.
 */
function shuffleOptions(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map((question) => {
      const order = question.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return {
        ...question,
        options: order.map((i) => question.options[i]),
        correctIndex: order.indexOf(question.correctIndex),
      };
    }),
  };
}

export function createRoom(hostId: string, quiz: Quiz): ServerRoom {
  const room: ServerRoom = {
    code: generateCode(),
    hostId,
    hostToken: randomUUID(),
    quiz: shuffleOptions(quiz),
    players: new Map(),
    state: 'lobby',
    currentQuestionIndex: -1,
    questionStartedAt: null,
    questionEndsAt: null,
    answers: [],
    createdAt: Date.now(),
    timer: null,
    reapers: new Map(),
    endedAt: null,
    bots: new Map(),
    botTimers: [],
  };
  rooms.set(room.code, room);
  return room;
}

export function getRoom(code: string): ServerRoom | undefined {
  return rooms.get(code.trim().toUpperCase());
}

export function requireRoom(code: string): ServerRoom {
  const room = getRoom(code);
  if (!room) throw new RoomError('Room not found');
  return room;
}

export function resumeHost(code: string, hostToken: string, socketId: string): ServerRoom {
  const room = requireRoom(code);
  if (room.hostToken !== hostToken) throw new RoomError('Not the host of this room');
  room.hostId = socketId;
  return room;
}

export function closeRoom(room: ServerRoom): void {
  clearQuestionTimer(room);
  for (const t of room.reapers.values()) clearTimeout(t);
  room.reapers.clear();
  rooms.delete(room.code);
}

// Players

export function joinRoom(
  room: ServerRoom,
  nickname: string,
  existingPlayerId?: string,
  avatar?: Partial<PlayerAvatar>,
): Player {
  // Reconnect path: a known id reclaims its score instead of starting over.
  // The avatar picked at first join sticks for the room — no mid-game outfit changes.
  if (existingPlayerId) {
    const existing = room.players.get(existingPlayerId);
    if (existing) {
      const reaper = room.reapers.get(existingPlayerId);
      if (reaper) {
        clearTimeout(reaper);
        room.reapers.delete(existingPlayerId);
      }
      existing.connected = true;
      return existing;
    }
  }

  if (room.state === 'ended') throw new RoomError('This game has already ended');
  if (room.players.size >= MAX_PLAYERS) throw new RoomError('Room is full');

  const clean = nickname.trim().slice(0, MAX_NICKNAME_LENGTH);
  if (clean.length < 2) throw new RoomError('Nickname must be at least 2 characters');

  const taken = [...room.players.values()].some(
    (p) => p.nickname.toLowerCase() === clean.toLowerCase(),
  );
  if (taken) throw new RoomError('That nickname is taken');

  const player: Player = {
    id: randomUUID(),
    nickname: clean,
    score: 0,
    connected: true,
    avatar: sanitizeAvatar(avatar),
  };
  room.players.set(player.id, player);
  return player;
}

/** Marks a player offline and schedules removal — a refresh shouldn't wipe their score. */
export function markDisconnected(
  room: ServerRoom,
  playerId: string,
  onReap: (room: ServerRoom, playerId: string) => void,
): void {
  const player = room.players.get(playerId);
  if (!player) return;
  player.connected = false;

  const reaper = setTimeout(() => {
    room.reapers.delete(playerId);
    const stale = room.players.get(playerId);
    if (stale && !stale.connected && room.state === 'lobby') {
      room.players.delete(playerId);
      onReap(room, playerId);
    }
  }, DISCONNECT_GRACE_MS);

  room.reapers.set(playerId, reaper);
}

export function removePlayer(room: ServerRoom, playerId: string): void {
  room.players.delete(playerId);
  const reaper = room.reapers.get(playerId);
  if (reaper) {
    clearTimeout(reaper);
    room.reapers.delete(playerId);
  }
}

// Game flow

export function currentQuestion(room: ServerRoom): Question | null {
  return room.quiz.questions[room.currentQuestionIndex] ?? null;
}

function clearQuestionTimer(room: ServerRoom): void {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  // Bot answers are scheduled per-question — stop any still pending so a bot
  // never fires submitAnswer() into a question that's already been revealed.
  for (const t of room.botTimers) clearTimeout(t);
  room.botTimers = [];
}

/** Advances to the next question and arms the server-side deadline. */
export function startNextQuestion(
  room: ServerRoom,
  onExpire: (room: ServerRoom) => void,
): Question {
  if (room.state === 'question') throw new RoomError('A question is already live');
  if (room.players.size === 0) throw new RoomError('No players have joined yet');

  const nextIndex = room.currentQuestionIndex + 1;
  const question = room.quiz.questions[nextIndex];
  if (!question) throw new RoomError('No questions left');

  clearQuestionTimer(room);
  room.currentQuestionIndex = nextIndex;
  room.state = 'question';
  room.questionStartedAt = Date.now();
  room.questionEndsAt = room.questionStartedAt + question.timeLimitSec * 1000;

  room.timer = setTimeout(() => {
    room.timer = null;
    if (room.state === 'question') onExpire(room);
  }, question.timeLimitSec * 1000);

  return question;
}

export function closeQuestion(room: ServerRoom): void {
  clearQuestionTimer(room);
  if (room.state !== 'question') return;
  room.state = 'results';
  room.questionEndsAt = Date.now();
}

export function endGame(room: ServerRoom): void {
  clearQuestionTimer(room);
  room.state = 'ended';
  room.questionStartedAt = null;
  room.questionEndsAt = null;
  room.endedAt = Date.now();
}

export function hasMoreQuestions(room: ServerRoom): boolean {
  return room.currentQuestionIndex + 1 < room.quiz.questions.length;
}

// Answers

export function submitAnswer(
  room: ServerRoom,
  playerId: string,
  optionIndex: number,
): Answer {
  if (room.state !== 'question') throw new RoomError('No question is live');

  const question = currentQuestion(room);
  const player = room.players.get(playerId);
  if (!question || !player) throw new RoomError('You are not in this game');
  if (optionIndex < 0 || optionIndex >= question.options.length) {
    throw new RoomError('Invalid option');
  }
  if (findAnswer(room, playerId, room.currentQuestionIndex)) {
    throw new RoomError('You already answered this question');
  }

  const answeredAt = Date.now();
  // The client-side countdown can lag; the server deadline is authoritative.
  if (room.questionEndsAt && answeredAt > room.questionEndsAt) {
    throw new RoomError('Time is up');
  }

  const correct = optionIndex === question.correctIndex;
  const pointsAwarded = scoreAnswer(
    correct,
    answeredAt,
    room.questionStartedAt ?? answeredAt,
    question.timeLimitSec,
  );

  const answer: Answer = {
    playerId,
    questionIndex: room.currentQuestionIndex,
    optionIndex,
    answeredAt,
    correct,
    pointsAwarded,
  };
  room.answers.push(answer);
  player.score += pointsAwarded;
  return answer;
}

export function findAnswer(
  room: ServerRoom,
  playerId: string,
  questionIndex: number,
): Answer | undefined {
  return room.answers.find(
    (a) => a.playerId === playerId && a.questionIndex === questionIndex,
  );
}

export function answeredCount(room: ServerRoom): number {
  return room.answers.filter((a) => a.questionIndex === room.currentQuestionIndex).length;
}

// Views

export function toPublicQuestion(room: ServerRoom, question: Question): PublicQuestion {
  return {
    index: room.currentQuestionIndex,
    total: room.quiz.questions.length,
    text: question.text,
    options: question.options,
    timeLimitSec: question.timeLimitSec,
    image: question.image,
  };
}

export function buildLeaderboard(room: ServerRoom): LeaderboardEntry[] {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
    .map((p, i) => ({
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      rank: i + 1,
      avatar: p.avatar,
    }));
}

export function buildResults(room: ServerRoom, viewerId?: string): QuestionResults | null {
  const question = room.quiz.questions[room.currentQuestionIndex];
  if (!question) return null;

  const tally = new Array<number>(question.options.length).fill(0);
  for (const a of room.answers) {
    if (a.questionIndex === room.currentQuestionIndex) tally[a.optionIndex]++;
  }

  const results: QuestionResults = {
    index: room.currentQuestionIndex,
    correctIndex: question.correctIndex,
    tally,
    leaderboard: buildLeaderboard(room),
  };

  if (viewerId) {
    const own = findAnswer(room, viewerId, room.currentQuestionIndex);
    if (own) {
      results.yourAnswer = {
        optionIndex: own.optionIndex,
        correct: own.correct,
        pointsAwarded: own.pointsAwarded,
      };
    }
  }
  return results;
}

export function buildSnapshot(room: ServerRoom, viewerId?: string): RoomSnapshot {
  const question = currentQuestion(room);
  const snapshot: RoomSnapshot = {
    code: room.code,
    state: room.state,
    quizTitle: room.quiz.title,
    quizSubtitle: room.quiz.subtitle,
    quizEmoji: room.quiz.emoji,
    questionCount: room.quiz.questions.length,
    players: [...room.players.values()],
    question: room.state === 'question' && question ? toPublicQuestion(room, question) : null,
    questionEndsAt: room.state === 'question' ? room.questionEndsAt : null,
    serverNow: Date.now(),
    results: room.state === 'results' ? buildResults(room, viewerId) : null,
  };

  if (viewerId) {
    snapshot.yourPlayerId = viewerId;
    snapshot.yourAnswerIndex =
      findAnswer(room, viewerId, room.currentQuestionIndex)?.optionIndex ?? null;
  }
  return snapshot;
}

// Housekeeping
//
// Pure and io-agnostic on purpose — this module never touches socket.io, so
// the interval that drives this lives in index.ts, where `io` actually is.
// `onClose` runs before the room is deleted, giving the caller a chance to
// notify anyone still connected (e.g. a player left staring at the podium).

export function sweepStaleRooms(onClose: (room: ServerRoom) => void): void {
  const now = Date.now();
  const emptyCutoff = now - EMPTY_ROOM_TTL_MS;
  const endedCutoff = now - ENDED_ROOM_TTL_MS;
  for (const room of rooms.values()) {
    const emptyAndStale = room.players.size === 0 && room.createdAt < emptyCutoff;
    const longEnded = room.endedAt !== null && room.endedAt < endedCutoff;
    if (emptyAndStale || longEnded) {
      onClose(room);
      closeRoom(room);
    }
  }
}

export function roomCount(): number {
  return rooms.size;
}
