import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, Quiz, ServerToClientEvents } from '@ryzzquizz/shared';
import { DEFAULT_QUIZ, getQuiz, saveQuiz } from '../services/quizStore.js';
import * as rooms from '../services/roomService.js';
import { RoomError, type ServerRoom } from '../services/roomService.js';
import * as bots from '../services/botService.js';
import { hasDevToolsAccess } from '../middleware/auth.js';
import type { AuthUser } from '../services/authService.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

/** What this socket is in the game — set on create/join, read by every other handler. */
interface Session {
  code: string;
  role: 'host' | 'player';
  playerId?: string;
}

const sessions = new Map<string, Session>();

/** quizId wins over an inline quiz; an unknown id is an error, not a silent default. */
function resolveQuiz(quizId?: string, quiz?: Quiz): Quiz {
  if (quizId) {
    const found = getQuiz(quizId);
    if (!found) throw new RoomError('That quiz is no longer available');
    return found;
  }
  return quiz ? saveQuiz(quiz) : DEFAULT_QUIZ;
}

function fail(err: unknown): { ok: false; error: string } {
  const message = err instanceof RoomError ? err.message : 'Something went wrong';
  if (!(err instanceof RoomError)) console.error(err);
  return { ok: false, error: message };
}

export function registerHandlers(
  io: IO,
  socket: Sock,
  devToolsEnabled: boolean,
  user: AuthUser | null,
): void {
  const session = () => sessions.get(socket.id);

  function requireSession(role?: Session['role']): { session: Session; room: ServerRoom } {
    const s = session();
    if (!s) throw new RoomError('You are not in a room');
    if (role && s.role !== role) throw new RoomError('Only the host can do that');
    return { session: s, room: rooms.requireRoom(s.code) };
  }

  function broadcastPlayers(room: ServerRoom): void {
    io.to(room.code).emit('room:players', { players: [...room.players.values()] });
  }

  /** Results carry per-player detail, so each player gets their own payload. */
  function broadcastResults(room: ServerRoom): void {
    const hostSocket = io.sockets.sockets.get(room.hostId);
    hostSocket?.emit('question:results', rooms.buildResults(room)!);

    for (const [socketId, s] of sessions) {
      if (s.code !== room.code || s.role !== 'player' || !s.playerId) continue;
      io.sockets.sockets
        .get(socketId)
        ?.emit('question:results', rooms.buildResults(room, s.playerId)!);
    }
  }

  function closeAndReveal(room: ServerRoom): void {
    rooms.closeQuestion(room);
    broadcastResults(room);
  }

  /** Shared tail of "an answer was just recorded" — used by both real players and dev-mode bots. */
  function afterAnswer(room: ServerRoom): void {
    io.to(room.code).emit('question:answered', {
      answeredCount: rooms.answeredCount(room),
      playerCount: room.players.size,
    });
    // Everyone in — no reason to make the room wait out the clock.
    if (rooms.answeredCount(room) >= room.players.size) closeAndReveal(room);
  }

  // Host

  socket.on('host:create', ({ quizId, quiz }, ack) => {
    try {
      const chosen = resolveQuiz(quizId, quiz);
      const room = rooms.createRoom(socket.id, chosen);
      sessions.set(socket.id, { code: room.code, role: 'host' });
      socket.join(room.code);
      ack({ ok: true, data: { ...rooms.buildSnapshot(room), hostToken: room.hostToken } });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:resume', ({ code, hostToken }, ack) => {
    try {
      const room = rooms.resumeHost(code, hostToken, socket.id);
      sessions.set(socket.id, { code: room.code, role: 'host' });
      socket.join(room.code);
      ack({ ok: true, data: rooms.buildSnapshot(room) });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:start', (_payload, ack) => {
    try {
      const { room } = requireSession('host');
      startQuestion(room);
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:next', (_payload, ack) => {
    try {
      const { room } = requireSession('host');
      if (!rooms.hasMoreQuestions(room)) {
        rooms.endGame(room);
        io.to(room.code).emit('game:over', { leaderboard: rooms.buildLeaderboard(room) });
      } else {
        startQuestion(room);
      }
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:skip', (_payload, ack) => {
    try {
      const { room } = requireSession('host');
      if (room.state !== 'question') throw new RoomError('No question is live');
      closeAndReveal(room);
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:end', (_payload, ack) => {
    try {
      const { room } = requireSession('host');
      rooms.endGame(room);
      io.to(room.code).emit('game:over', { leaderboard: rooms.buildLeaderboard(room) });
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('host:exit', (_payload, ack) => {
    try {
      const { room } = requireSession('host');
      io.to(room.code).emit('room:closed', { reason: 'The host has closed this room.' });
      rooms.closeRoom(room);
      sessions.delete(socket.id);
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  function startQuestion(room: ServerRoom): void {
    const question = rooms.startNextQuestion(room, closeAndReveal);
    io.to(room.code).emit('question:start', {
      question: rooms.toPublicQuestion(room, question),
      endsAt: room.questionEndsAt!,
      serverNow: Date.now(),
    });

    bots.scheduleBotAnswers(room, question, (playerId, optionIndex) => {
      try {
        rooms.submitAnswer(room, playerId, optionIndex);
        afterAnswer(room);
      } catch {
        // Question may have already closed (e.g. host:skip) — nothing to do.
      }
    });
  }

  // Developer mode — see botService.ts. Rejected outright when dev tools
  // aren't enabled; the client also hides the entry point, but the real gate
  // is here, server-side.

  socket.on('dev:addBots', async ({ count, preset }, ack) => {
    try {
      // Both gates, server-side: the deployment-wide switch, then this
      // caller's role read fresh from the database (never from the token).
      if (!devToolsEnabled) throw new RoomError('Developer tools are disabled');
      if (!(await hasDevToolsAccess(user))) {
        throw new RoomError('You need the DEVELOPER role to use developer tools');
      }
      const { room } = requireSession('host');
      bots.addBots(room, count, preset);
      broadcastPlayers(room);
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  // Player

  socket.on('player:join', ({ code, nickname, playerId, avatar }, ack) => {
    try {
      const room = rooms.requireRoom(code);
      const player = rooms.joinRoom(room, nickname, playerId, avatar);
      sessions.set(socket.id, { code: room.code, role: 'player', playerId: player.id });
      socket.join(room.code);

      ack({ ok: true, data: { ...rooms.buildSnapshot(room, player.id), playerId: player.id } });
      broadcastPlayers(room);
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('player:answer', ({ optionIndex }, ack) => {
    try {
      const { session: s, room } = requireSession('player');
      rooms.submitAnswer(room, s.playerId!, optionIndex);
      ack({ ok: true, data: { accepted: true } });
      afterAnswer(room);
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('player:leave', (_payload, ack) => {
    try {
      const { session: s, room } = requireSession('player');
      rooms.removePlayer(room, s.playerId!);
      sessions.delete(socket.id);
      socket.leave(room.code);
      broadcastPlayers(room);
      ack({ ok: true, data: null });
    } catch (err) {
      ack(fail(err));
    }
  });

  socket.on('disconnect', () => {
    const s = sessions.get(socket.id);
    sessions.delete(socket.id);
    if (!s) return;

    const room = rooms.getRoom(s.code);
    if (!room) return;

    // Host drops mid-game: the room survives long enough for host:resume to land.
    if (s.role === 'host') return;

    if (s.playerId) {
      rooms.markDisconnected(room, s.playerId, (r) => broadcastPlayers(r));
      broadcastPlayers(room);
    }
  });
}
