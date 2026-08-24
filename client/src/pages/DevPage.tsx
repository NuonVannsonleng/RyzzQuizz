import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import type {
  BotPreset,
  LeaderboardEntry,
  Player,
  PublicQuestion,
  QuestionResults,
  QuizSummary,
  RoomSnapshot,
} from '@ryzzquizz/shared';
import { connect, emit, socket } from '../lib/socket.js';
import { spring } from '../lib/motion.js';
import { useCountdown } from '../lib/useCountdown.js';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../lib/authContext.js';
import { useDevStatus } from '../lib/devTools.js';
import { Navbar } from '../components/Navbar.js';
import { Button } from '../components/Button.js';
import { Leaderboard } from '../components/Leaderboard.js';
import { Podium } from '../components/Podium.js';
import { ResultsBars } from '../components/ResultsBars.js';
import { Timer } from '../components/Timer.js';

const PLAYER_COUNT_PRESETS = [2, 5, 10, 20];
const BOT_PRESETS: BotPreset[] = ['mixed', 'perfect', 'beginner', 'fast', 'slow', 'random', 'timeout'];
// Pause on the results screen before auto-advancing, so the reveal/reorder is
// actually watchable instead of flashing past.
const AUTO_ADVANCE_MS = 2600;

type Phase = 'picker' | 'running';

export function DevPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const devStatus = useDevStatus(user?.id ?? null);
  const [phase, setPhase] = useState<Phase>('picker');

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quizId, setQuizId] = useState('');
  const [count, setCount] = useState(10);
  const [preset, setPreset] = useState<BotPreset>('mixed');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [deadline, setDeadline] = useState<{ endsAt: number; serverNow: number } | null>(null);
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [finalBoard, setFinalBoard] = useState<LeaderboardEntry[] | null>(null);
  const [answered, setAnswered] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { seconds, ms } = useCountdown(deadline?.endsAt ?? null, deadline?.serverNow ?? null);

  useEffect(() => {
    if (!devStatus.enabled) return;
    fetch('/api/quizzes')
      .then((res) => res.json())
      .then((data: QuizSummary[]) => {
        setQuizzes(data);
        setQuizId((current) => current || data[0]?.id || '');
      })
      .catch(() => setQuizzes([]));
  }, [devStatus.enabled]);

  // Listeners are registered once on mount, independent of `phase` — startTestGame()
  // calls host:start right after flipping to 'running', and gating this on phase would
  // race the effect commit against the server's question:start broadcast.
  useEffect(() => {
    connect();

    socket.on('room:state', (snap) => {
      setSnapshot(snap);
      setPlayers(snap.players);
      setQuestion(snap.question);
      setResults(snap.results);
      setDeadline(snap.questionEndsAt ? { endsAt: snap.questionEndsAt, serverNow: snap.serverNow } : null);
    });
    socket.on('room:players', ({ players: p }) => setPlayers(p));
    socket.on('question:start', ({ question: q, endsAt, serverNow }) => {
      setQuestion(q);
      setResults(null);
      setAnswered(0);
      setDeadline({ endsAt, serverNow });
      setSnapshot((s) => (s ? { ...s, state: 'question' } : s));
    });
    socket.on('question:answered', ({ answeredCount }) => setAnswered(answeredCount));
    socket.on('question:results', (r) => {
      setResults(r);
      setDeadline(null);
      setSnapshot((s) => (s ? { ...s, state: 'results' } : s));
      // Same engine as a real host clicking "Next question" — just on a timer.
      advanceTimer.current = setTimeout(() => {
        void emit('host:next', {});
      }, AUTO_ADVANCE_MS);
    });
    socket.on('game:over', ({ leaderboard }) => {
      setFinalBoard(leaderboard);
      setDeadline(null);
      setSnapshot((s) => (s ? { ...s, state: 'ended' } : s));
    });
    socket.on('error:msg', ({ message }) => setError(message));

    return () => {
      socket.off('room:state');
      socket.off('room:players');
      socket.off('question:start');
      socket.off('question:answered');
      socket.off('question:results');
      socket.off('game:over');
      socket.off('error:msg');
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  async function startTestGame() {
    if (!quizId) return;
    setError('');
    setStarting(true);
    try {
      connect();
      const snap = await emit('host:create', { quizId });
      setSnapshot(snap);
      setPlayers(snap.players);
      await emit('dev:addBots', { count, preset });
      setPhase('running');
      await emit('host:start', {});
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dev.errorStart'));
      setPhase('picker');
    } finally {
      setStarting(false);
    }
  }

  async function reset() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    try {
      await emit('host:exit', {});
    } catch {
      // Room may already be gone — fine either way.
    }
    setSnapshot(null);
    setPlayers([]);
    setQuestion(null);
    setDeadline(null);
    setResults(null);
    setFinalBoard(null);
    setAnswered(0);
    setPhase('picker');
  }

  if (!devStatus.enabled) {
    const needsRole = devStatus.reason === 'needs-developer-role';
    return (
      <div className="app-shell">
        <Navbar />
        <main className="page shell shell--center">
          {authLoading ? (
            <p className="muted">{t('common.loading')}</p>
          ) : (
            <>
              <p className="muted">{needsRole ? t('dev.needsRole') : t('dev.disabled')}</p>
              {needsRole && <p className="devpage__rolehint">{t('dev.needsRoleHint')}</p>}
              {needsRole && !user && (
                <Button variant="primary" onClick={() => navigate('/login')}>
                  {t('auth.login')}
                </Button>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page container">
        <h1 className="devpage__title">🧪 {t('dev.title')}</h1>

        {phase === 'picker' && (
          <section className="devpage__panel">
            {error && <p className="error" role="alert">{error}</p>}

            <label htmlFor="dev-quiz">{t('dev.quiz')}</label>
            <select id="dev-quiz" className="input" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.emoji} {q.title}
                </option>
              ))}
            </select>

            <label>{t('dev.players')}</label>
            <div className="pill-btn-row">
              {PLAYER_COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pill-btn ${count === n ? 'is-active' : ''}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                className="input devpage__countinput"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                aria-label={t('dev.customCount')}
              />
            </div>

            <label>{t('dev.preset')}</label>
            <div className="pill-btn-row">
              {BOT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pill-btn ${preset === p ? 'is-active' : ''}`}
                  onClick={() => setPreset(p)}
                >
                  {t(`dev.presetLabel.${p}`)}
                </button>
              ))}
            </div>

            <Button variant="primary" size="lg" loading={starting} disabled={!quizId} onClick={startTestGame}>
              {t('dev.start')}
            </Button>
          </section>
        )}

        {phase === 'running' && snapshot && (
          <section className="devpage__panel">
            {error && <p className="error" role="alert">{error}</p>}

            <div className="devpage__runhead">
              <span className="pill">
                🔑 {snapshot.code} · {players.length} {t('common.players')}
              </span>
              <Button variant="ghost" onClick={reset}>
                {t('dev.reset')}
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {snapshot.state === 'question' && question && (
                <m.div
                  key={`q${question.index}`}
                  className="devpage__stage"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={spring.pop}
                >
                  <div className="devpage__stagetop">
                    <span className="qmeta__count">
                      {t('host.question')} {question.index + 1} / {question.total}
                    </span>
                    <Timer seconds={seconds} ms={ms} total={question.timeLimitSec} />
                  </div>
                  <h2 className="qtext">{question.text}</h2>
                  <p className="muted">{answered} / {players.length} {t('host.answered')}</p>
                </m.div>
              )}

              {snapshot.state === 'results' && results && question && (
                <m.div
                  key={`r${results.index}`}
                  className="devpage__stage"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <h2 className="qtext">{question.text}</h2>
                  <ResultsBars options={question.options} tally={results.tally} correctIndex={results.correctIndex} />
                  <Leaderboard entries={results.leaderboard} limit={8} />
                </m.div>
              )}

              {snapshot.state === 'ended' && (
                <m.div
                  key="ended"
                  className="devpage__stage"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h2>🏆 {t('host.finalScores')}</h2>
                  <Podium entries={finalBoard ?? []} />
                  <Leaderboard entries={finalBoard ?? []} />
                </m.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </main>
    </div>
  );
}
