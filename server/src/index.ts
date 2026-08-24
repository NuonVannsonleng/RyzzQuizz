import 'dotenv/config';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@ryzzquizz/shared';
import { isUserType } from '@ryzzquizz/shared';
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  hasDevToolsAccess,
  readUserFromRequest,
  setAuthCookie,
  signToken,
  verifyToken,
} from './middleware/auth.js';
import { catalogStats, getQuiz, listQuizzes, toSummary } from './services/quizStore.js';
import { getRoom, roomCount, sweepStaleRooms } from './services/roomService.js';
import { UserError, getUserById, registerUser, setUserType, verifyLogin } from './services/authService.js';
import { registerHandlers } from './socket/registerHandlers.js';

const PORT = Number(process.env.PORT ?? 3001);
const ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const INSTANCE_ID = process.env.INSTANCE_ID ?? process.env.HOSTNAME ?? 'local';
// On by default outside production; ENABLE_DEV_TOOLS=false forces it off even
// in dev, ENABLE_DEV_TOOLS=true forces it on even if NODE_ENV somehow isn't set.
const DEV_TOOLS_ENABLED =
  process.env.ENABLE_DEV_TOOLS === 'true' ||
  (process.env.ENABLE_DEV_TOOLS !== 'false' && process.env.NODE_ENV !== 'production');

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Load balancer health check + proof of which instance served you.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', instance: INSTANCE_ID, rooms: roomCount(), uptime: process.uptime() });
});

// Browse the catalog: /api/quizzes?category=education&grade=7&subject=math&difficulty=easy&search=…
app.get('/api/quizzes', (req, res) => {
  const gradeParam = req.query.grade;
  const grade = typeof gradeParam === 'string' && gradeParam !== '' ? Number(gradeParam) : undefined;

  res.json(
    listQuizzes({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      grade: Number.isFinite(grade) ? grade : undefined,
      subject: typeof req.query.subject === 'string' ? req.query.subject : undefined,
      difficulty: typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    }),
  );
});

app.get('/api/catalog', (_req, res) => {
  res.json(catalogStats());
});

// Two independent gates: the server-wide env switch, and the caller's role in
// the database. The client uses `reason` only to explain itself — real
// enforcement lives in registerHandlers.ts, which rechecks both.
app.get('/api/dev/status', async (req, res) => {
  if (!DEV_TOOLS_ENABLED) {
    return res.json({ enabled: false, reason: 'disabled-on-server' });
  }
  const allowed = await hasDevToolsAccess(readUserFromRequest(req));
  res.json({
    enabled: allowed,
    reason: allowed ? 'ok' : 'needs-developer-role',
  });
});

// Auth — additive only. Hosting and joining a game never require an account;
// this is purely for the features later phases will build on top of it.

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, userType } = req.body ?? {};
  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing username, email, or password' });
  }
  try {
    // systemRole is intentionally not accepted from the client — see authService.
    const user = await registerUser(username, email, password, userType);
    setAuthCookie(res, signToken(user));
    res.json(user);
  } catch (err) {
    if (err instanceof UserError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Could not create your account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { emailOrUsername, password } = req.body ?? {};
  if (typeof emailOrUsername !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing email/username or password' });
  }
  try {
    const user = await verifyLogin(emailOrUsername, password);
    setAuthCookie(res, signToken(user));
    res.json(user);
  } catch (err) {
    if (err instanceof UserError) return res.status(401).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Could not log you in' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Reads through to the database rather than just decoding the token, so a
// role granted or revoked since login shows up without needing a re-login.
app.get('/api/auth/me', async (req, res) => {
  const claim = readUserFromRequest(req);
  if (!claim) return res.status(401).json({ error: 'Not authenticated' });
  const user = await getUserById(claim.id);
  if (!user) {
    // Account deleted out from under a still-valid token.
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(user);
});

// Changing how you use RyzzQuizz is a preference, so a user may set their own.
// system_role is deliberately NOT settable here — promotion is an out-of-band
// admin action (see `npm run user:role`).
app.post('/api/auth/user-type', async (req, res) => {
  const claim = readUserFromRequest(req);
  if (!claim) return res.status(401).json({ error: 'Not authenticated' });
  const { userType } = req.body ?? {};
  if (!isUserType(userType)) return res.status(400).json({ error: 'Unknown user type' });

  await setUserType(claim.id, userType);
  const user = await getUserById(claim.id);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  // Re-issue the cookie so the token's copy doesn't drift from the database.
  setAuthCookie(res, signToken(user));
  res.json(user);
});

// Preview a quiz before hosting it — question text only, never correctIndex.
app.get('/api/quizzes/:id', (req, res) => {
  const quiz = getQuiz(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json({
    ...toSummary(quiz),
    questions: quiz.questions.map((question) => ({
      text: question.text,
      optionCount: question.options.length,
      timeLimitSec: question.timeLimitSec,
    })),
  });
});

// Lets the join screen validate a code before opening a socket.
app.get('/api/rooms/:code', (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    code: room.code,
    state: room.state,
    quizTitle: room.quiz.title,
    playerCount: room.players.size,
  });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: ORIGIN, credentials: true },
});

/** Minimal cookie-header parser — cookie-parser is Express middleware and doesn't run for socket handshakes. */
function cookieFromHeader(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

io.on('connection', (socket) => {
  // Identity is captured from the handshake cookie at connect time. The client
  // drops its socket on login/logout (see authContext.tsx) so this can't go
  // stale mid-session; privileged handlers re-check the role in the DB anyway.
  const user = verifyToken(cookieFromHeader(socket.handshake.headers.cookie, AUTH_COOKIE_NAME));
  registerHandlers(io, socket, DEV_TOOLS_ENABLED, user);
});

// Frees rooms nobody is coming back to — an empty room past its TTL, or a
// finished game whose players never explicitly left the podium screen.
setInterval(() => {
  sweepStaleRooms((room) => {
    io.to(room.code).emit('room:closed', { reason: 'This room has been closed.' });
  });
}, 5 * 60 * 1000).unref();

// Single-origin production build: serve the built client from the API server.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../client/dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

httpServer.listen(PORT, () => {
  console.log(`RyzzQuizz server [${INSTANCE_ID}] listening on :${PORT}`);
});
