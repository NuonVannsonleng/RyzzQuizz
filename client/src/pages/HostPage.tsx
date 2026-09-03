import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import type {
  LeaderboardEntry,
  Player,
  PublicQuestion,
  QuestionResults,
  RoomSnapshot,
} from '@ryzzquizz/shared';
import { connect, emit, socket } from '../lib/socket.js';
import { spring } from '../lib/motion.js';
import { useCountdown } from '../lib/useCountdown.js';
import { useI18n } from '../i18n/index.js';
import { useToast } from '../components/ToastProvider.js';
import { sfxStart } from '../lib/sfx.js';
import { playMusic } from '../lib/music.js';
import { Navbar } from '../components/Navbar.js';
import { Banner } from '../components/Banner.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { ConnectionStatus } from '../components/ConnectionStatus.js';
import { AvatarView } from '../components/AvatarView.js';
import { Leaderboard } from '../components/Leaderboard.js';
import { OptionShape } from '../components/OptionShape.js';
import { PartyBackground } from '../components/PartyBackground.js';
import { Podium } from '../components/Podium.js';
import { QuestionMedia } from '../components/QuestionMedia.js';
import { QuizLibrary } from '../components/QuizLibrary.js';
import { ResultsBars } from '../components/ResultsBars.js';
import { Timer } from '../components/Timer.js';

const HOST_STORAGE_KEY = 'ryzzquizz:host';

type Phase = 'loading' | 'picking' | 'room';

/** A joined player as a colourful chip — background tints toward their own avatar colour, Kahoot-style. */
function PlayerChip({ player }: { player: Player }) {
  return (
    <m.li
      className={`playerchip ${player.connected ? '' : 'is-offline'}`}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: player.connected ? 1 : 0.5, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      transition={spring.pop}
    >
      <AvatarView avatar={player.avatar} size="sm" />
      {player.nickname}
    </m.li>
  );
}

/** Set by the Home discovery cards — either jump straight into a quiz, or open the library on a shelf. */
interface HostNavState {
  quizId?: string;
  category?: string;
}

export function HostPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navState = useLocation().state as HostNavState | null;
  const autoPicked = useRef(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [picking, setPicking] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [deadline, setDeadline] = useState<{ endsAt: number; serverNow: number } | null>(null);
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [finalBoard, setFinalBoard] = useState<LeaderboardEntry[] | null>(null);
  const [answered, setAnswered] = useState(0);
  const [error, setError] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { seconds, ms } = useCountdown(deadline?.endsAt ?? null, deadline?.serverNow ?? null);

  useEffect(() => {
    if (snapshot?.state === 'question' || snapshot?.state === 'results') playMusic('game');
    else if (snapshot?.state === 'ended') playMusic('victory');
    else playMusic('menu');
  }, [phase, snapshot?.state]);

  const applySnapshot = useCallback((snap: RoomSnapshot) => {
    setSnapshot(snap);
    setPlayers(snap.players);
    setQuestion(snap.question);
    setResults(snap.results);
    setDeadline(
      snap.questionEndsAt ? { endsAt: snap.questionEndsAt, serverNow: snap.serverNow } : null,
    );
    setPhase('room');
  }, []);

  useEffect(() => {
    connect();

    // A saved token means a refresh mid-game; otherwise the host picks a quiz first.
    async function resume() {
      const saved = sessionStorage.getItem(HOST_STORAGE_KEY);
      if (!saved) {
        setPhase((p) => (p === 'loading' ? 'picking' : p));
        return;
      }
      try {
        const { code, hostToken } = JSON.parse(saved);
        applySnapshot(await emit('host:resume', { code, hostToken }));
      } catch {
        sessionStorage.removeItem(HOST_STORAGE_KEY);
        setPhase('picking');
      }
    }

    socket.on('connect', resume);
    socket.on('room:state', applySnapshot);
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
    });
    socket.on('game:over', ({ leaderboard }) => {
      setFinalBoard(leaderboard);
      setDeadline(null);
      setSnapshot((s) => (s ? { ...s, state: 'ended' } : s));
    });
    socket.on('error:msg', ({ message }) => setError(message));

    if (socket.connected) void resume();

    return () => {
      socket.off('connect', resume);
      socket.off('room:state');
      socket.off('room:players');
      socket.off('question:start');
      socket.off('question:answered');
      socket.off('question:results');
      socket.off('game:over');
      socket.off('error:msg');
    };
  }, [applySnapshot]);

  async function createRoom(quizId: string) {
    setError('');
    setPicking(quizId);
    try {
      const snap = await emit('host:create', { quizId });
      sessionStorage.setItem(
        HOST_STORAGE_KEY,
        JSON.stringify({ code: snap.code, hostToken: snap.hostToken }),
      );
      applySnapshot(snap);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('host.errorCreate'));
    } finally {
      setPicking(null);
    }
  }

  // Arriving from a Home "featured quiz" card — open its room straight away
  // instead of making the host find the same quiz again in the library.
  useEffect(() => {
    if (phase !== 'picking' || autoPicked.current || !navState?.quizId) return;
    autoPicked.current = true;
    void createRoom(navState.quizId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, navState]);

  async function run(action: 'host:start' | 'host:next' | 'host:skip' | 'host:end') {
    setError('');
    try {
      await emit(action, {});
      if (action === 'host:start') {
        sfxStart();
        toast.push(t('toast.quizStarted'), '🚀');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('host.errorAction'));
    }
  }

  async function newGame() {
    // Best-effort — the room gets swept passively either way, this just frees
    // it (and notifies any lingering players) immediately instead of in ~15min.
    try {
      await emit('host:exit', {});
    } catch {
      // Room may already be gone; nothing to do either way.
    }
    sessionStorage.removeItem(HOST_STORAGE_KEY);
    window.location.reload();
  }

  if (phase === 'loading') {
    return (
      <div className="app-shell">
        <Navbar right={<ConnectionStatus />} />
        <main className="page shell shell--center">
          <p className="muted">{t('common.connecting')}</p>
        </main>
      </div>
    );
  }

  if (phase === 'picking') {
    return (
      <div className="app-shell">
        <Navbar right={<ConnectionStatus />} />
        <main className="page container container--wide">
          {error && <p className="error" role="alert">{error}</p>}
          <QuizLibrary onPick={createRoom} picking={picking} initialCategory={navState?.category} />
        </main>
      </div>
    );
  }

  if (!snapshot) return null;

  const isLast = question ? question.index + 1 >= question.total : false;

  if (snapshot.state === 'lobby') {
    return (
      <div className="app-shell">
        <Navbar right={<ConnectionStatus />} />
        <main className="page container container--wide">
          {error && <p className="error" role="alert">{error}</p>}
          <section className="lobbybig">
            <PartyBackground />
            <Banner size="md" />
            <div className="lobbybig__pin">
              <span className="lobbybig__pin-label">{t('host.joinAt')}</span>
              <div className="lobbybig__pin-code">{snapshot.code}</div>
              <span className="lobbybig__pin-hint">
                {snapshot.quizEmoji} {snapshot.quizTitle}
              </span>
            </div>

            {/* initial={false} — the list first mounts with the snapshot roster
                already in place, so only later arrivals animate. */}
            <ul className="lobbybig__players">
              <AnimatePresence initial={false}>
                {players.map((p) => (
                  <PlayerChip key={p.id} player={p} />
                ))}
              </AnimatePresence>
            </ul>
            {players.length === 0 && <p className="muted" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>{t('host.nobodyYet')}</p>}

            <div className="lobbybig__footer">
              <m.span
                key={players.length}
                className="pill"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={spring.pop}
              >
                {players.length} {t('common.players')}
              </m.span>
              <Button variant="primary" size="lg" disabled={players.length === 0} onClick={() => run('host:start')}>
                {t('host.startQuiz')}
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Question and results are the "projector" moments — the whole point of a
  // classroom big-screen host is that they fill it, not sit in a small card
  // with dead space on all sides.
  if (snapshot.state === 'question' && question) {
    return (
      <div className="app-shell">
        <Navbar right={<ConnectionStatus />} />
        <main className="page container container--wide">
          {error && <p className="error" role="alert">{error}</p>}
          <AnimatePresence mode="wait">
            <m.section
              key={`q${question.index}`}
              className="stagescreen"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={spring.pop}
            >
              <div className="stagescreen__top">
                <span className="stagescreen__pin">
                  🔑 {snapshot.code} · {snapshot.quizEmoji} {snapshot.quizTitle}
                </span>
                <span className="qmeta__count">
                  {t('host.question')} {question.index + 1} / {question.total}
                </span>
                <Timer seconds={seconds} ms={ms} total={question.timeLimitSec} />
              </div>

              <div className="stagescreen__question">
                <h2 className="qtext">{question.text}</h2>
                {question.image && (
                  <div className="stagescreen__media">
                    <QuestionMedia image={question.image} size="lg" />
                  </div>
                )}
              </div>

              <ol className="options options--host">
                {question.options.map((opt, i) => (
                  <m.li
                    key={i}
                    className={`option option--${i}`}
                    initial={{ opacity: 0, y: 24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...spring.pop, delay: 0.06 * i }}
                  >
                    <OptionShape index={i} />
                    <span className="option__text">{opt}</span>
                  </m.li>
                ))}
              </ol>

              <div className="stagescreen__foot">
                <div className="answercount">
                  <m.span
                    key={answered}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={spring.pop}
                    className="answercount__num"
                  >
                    {answered}
                  </m.span>
                  <span className="muted">
                    {t('common.of')} {players.length} {t('host.answered')}
                  </span>
                </div>
                <Button variant="ghost" onClick={() => run('host:skip')}>
                  {t('host.revealNow')}
                </Button>
              </div>
            </m.section>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  if (snapshot.state === 'results' && results && question) {
    return (
      <div className="app-shell">
        <Navbar right={<ConnectionStatus />} />
        <main className="page container container--wide">
          {error && <p className="error" role="alert">{error}</p>}
          <AnimatePresence mode="wait">
            <m.section
              key={`r${results.index}`}
              className="stagescreen"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="stagescreen__top">
                <span className="stagescreen__pin">
                  🔑 {snapshot.code} · {snapshot.quizEmoji} {snapshot.quizTitle}
                </span>
                <span className="qmeta__count">
                  {t('host.question')} {question.index + 1} / {question.total}
                </span>
              </div>

              <h2 className="qtext" style={{ textAlign: 'center' }}>{question.text}</h2>
              {question.image && (
                <div className="stagescreen__media stagescreen__media--sm">
                  <QuestionMedia image={question.image} size="md" />
                </div>
              )}

              <div className="stagescreen__resultsgrid">
                <ResultsBars
                  options={question.options}
                  tally={results.tally}
                  correctIndex={results.correctIndex}
                />
                <Leaderboard entries={results.leaderboard} limit={5} />
              </div>

              <div className="stagescreen__foot">
                <span className="muted" />
                <div className="actions">
                  <Button variant="primary" size="lg" onClick={() => run('host:next')}>
                    {isLast ? t('host.finish') : t('host.nextQuestion')}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmEnd(true)}>
                    {t('host.endGame')}
                  </Button>
                </div>
              </div>
            </m.section>
          </AnimatePresence>
        </main>
        <ConfirmDialog
          open={confirmEnd}
          title={t('host.confirmEndTitle')}
          body={t('host.confirmEndBody')}
          confirmLabel={t('host.confirmEndButton')}
          danger
          onConfirm={() => {
            setConfirmEnd(false);
            void run('host:end');
          }}
          onCancel={() => setConfirmEnd(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar right={<ConnectionStatus />} />
      <main className="page shell">
        <header className="topbar">
          <div>
            <span className="muted">{t('host.joinAt')}</span>
            <div className="roomcode">{snapshot.code}</div>
          </div>
          <div className="topbar__meta">
            <m.span
              key={players.length}
              className="pill"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={spring.pop}
            >
              {players.length} {t('common.players')}
            </m.span>
            <span className="pill">
              {snapshot.quizEmoji} {snapshot.quizTitle}
            </span>
          </div>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        <AnimatePresence mode="wait">
          {snapshot.state === 'ended' && (
            <m.section
              key="ended"
              className="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2>🏆 {t('host.finalScores')}</h2>
              <Podium entries={finalBoard ?? []} />
              <Leaderboard entries={finalBoard ?? []} />
              <Button variant="primary" size="lg" onClick={newGame}>
                {t('host.hostAnother')}
              </Button>
            </m.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
