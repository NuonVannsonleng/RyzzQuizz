import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import type {
  LeaderboardEntry,
  Player,
  PublicQuestion,
  QuestionResults,
  RoomSnapshot,
} from '@ryzzquizz/shared';
import { connect, emit, socket } from '../lib/socket.js';
import { useCountdown } from '../lib/useCountdown.js';
import { spring } from '../lib/motion.js';
import { useI18n } from '../i18n/index.js';
import { useToast } from '../components/ToastProvider.js';
import { getWallet, earnCoins } from '../lib/wallet.js';
import { playMusic } from '../lib/music.js';
import { Navbar } from '../components/Navbar.js';
import { Banner } from '../components/Banner.js';
import { Button } from '../components/Button.js';
import { CoinBadge } from '../components/CoinBadge.js';
import { ConnectionStatus } from '../components/ConnectionStatus.js';
import { AvatarView } from '../components/AvatarView.js';
import { AnswerGrid } from '../components/AnswerGrid.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Leaderboard } from '../components/Leaderboard.js';
import { Podium } from '../components/Podium.js';
import { QuestionMedia } from '../components/QuestionMedia.js';
import { Timer } from '../components/Timer.js';
import { Verdict } from '../components/Verdict.js';

const PLAYER_STORAGE_KEY = 'ryzzquizz:player';

interface JoinState {
  code: string;
  nickname: string;
}

/** Participation floor of 5 keeps a rough game from feeling worthless; the rest scales with score. */
function coinsForScore(score: number): number {
  return Math.max(5, Math.round(score / 40));
}

export function PlayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const joinState = location.state as JoinState | null;
  const { t } = useI18n();
  const toast = useToast();

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [deadline, setDeadline] = useState<{ endsAt: number; serverNow: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [finalBoard, setFinalBoard] = useState<LeaderboardEntry[] | null>(null);
  const [streak, setStreak] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const playerId = useRef<string | null>(null);
  const booted = useRef(false);
  const coinsAwarded = useRef(false);
  const startToastShown = useRef(false);

  const { seconds, ms } = useCountdown(deadline?.endsAt ?? null, deadline?.serverNow ?? null);

  useEffect(() => {
    if (snapshot?.state === 'question' || snapshot?.state === 'results') playMusic('game');
    else if (snapshot?.state === 'ended') playMusic('victory');
    else playMusic('menu');
  }, [snapshot?.state]);

  useEffect(() => {
    const saved = sessionStorage.getItem(PLAYER_STORAGE_KEY);
    const stored = saved ? (JSON.parse(saved) as JoinState & { playerId: string }) : null;
    const target = joinState ?? stored;

    if (!target) {
      navigate('/');
      return;
    }

    connect();

    async function join() {
      if (booted.current) return;
      booted.current = true;
      try {
        const snap = await emit('player:join', {
          code: target!.code,
          nickname: target!.nickname,
          playerId: stored?.playerId,
          avatar: getWallet().avatar,
        });
        playerId.current = snap.playerId;
        sessionStorage.setItem(
          PLAYER_STORAGE_KEY,
          JSON.stringify({ code: target!.code, nickname: target!.nickname, playerId: snap.playerId }),
        );
        applySnapshot(snap);
        toast.push(t('toast.joined'), '🎉');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('play.errorJoin'));
      }
    }

    function applySnapshot(snap: RoomSnapshot) {
      setSnapshot(snap);
      setPlayers(snap.players);
      setQuestion(snap.question);
      setResults(snap.results);
      setPicked(snap.yourAnswerIndex ?? null);
      setDeadline(
        snap.questionEndsAt ? { endsAt: snap.questionEndsAt, serverNow: snap.serverNow } : null,
      );
    }

    // Reconnect re-runs join with the stored playerId, which restores the score.
    const rejoin = () => {
      booted.current = false;
      void join();
    };

    socket.on('connect', rejoin);
    socket.on('room:state', applySnapshot);
    socket.on('room:players', ({ players: p }) => setPlayers(p));
    socket.on('question:start', ({ question: q, endsAt, serverNow }) => {
      setQuestion(q);
      setResults(null);
      setPicked(null);
      setDeadline({ endsAt, serverNow });
      setSnapshot((s) => (s ? { ...s, state: 'question' } : s));
      if (!startToastShown.current) {
        startToastShown.current = true;
        toast.push(t('toast.quizStarted'), '🚀');
      }
    });
    socket.on('question:results', (r) => {
      setResults(r);
      setDeadline(null);
      setStreak((prev) => (r.yourAnswer?.correct ? prev + 1 : 0));
      setSnapshot((s) => (s ? { ...s, state: 'results' } : s));
    });
    socket.on('game:over', ({ leaderboard }) => {
      setFinalBoard(leaderboard);
      setDeadline(null);
      setSnapshot((s) => (s ? { ...s, state: 'ended' } : s));

      // Coins are a client-only meta-layer (no accounts), so the "purchase"
      // of playing a full game is credited here, once, straight to the wallet.
      if (!coinsAwarded.current) {
        coinsAwarded.current = true;
        const mine = leaderboard.find((e) => e.playerId === playerId.current);
        const amount = coinsForScore(mine?.score ?? 0);
        earnCoins(amount);
        setCoinsEarned(amount);
      }
    });
    socket.on('room:closed', ({ reason }) => {
      setError(reason);
      toast.push(t('toast.roomClosed'), '🚪');
    });
    socket.on('error:msg', ({ message }) => setError(message));

    if (socket.connected) void join();

    return () => {
      socket.off('connect', rejoin);
      socket.off('room:state');
      socket.off('room:players');
      socket.off('question:start');
      socket.off('question:results');
      socket.off('game:over');
      socket.off('room:closed');
      socket.off('error:msg');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinState, navigate]);

  async function answer(optionIndex: number) {
    if (picked !== null) return;
    setPicked(optionIndex); // optimistic — rolled back if the server rejects
    try {
      await emit('player:answer', { optionIndex });
    } catch (err) {
      setPicked(null);
      setError(err instanceof Error ? err.message : t('play.errorAnswer'));
    }
  }

  function leave() {
    sessionStorage.removeItem(PLAYER_STORAGE_KEY);
    socket.disconnect();
    navigate('/');
  }

  if (!snapshot) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="page shell shell--center">
          <p className="muted">{error || t('play.joining')}</p>
          {error && (
            <Button variant="ghost" onClick={() => navigate('/')}>
              {t('common.back')}
            </Button>
          )}
        </main>
      </div>
    );
  }

  const me = players.find((p) => p.id === playerId.current);
  // Full-bleed, chrome-free layout only while a question is actually live —
  // every other state keeps the normal narrow, navbar-topped shell.
  const isQuestion = snapshot.state === 'question' && question;

  return (
    <div className="app-shell">
      {!isQuestion && <Navbar right={<><ConnectionStatus /><CoinBadge /></>} />}
      <main className={`page ${isQuestion ? 'playscreen' : 'shell'}`}>
        {!isQuestion && (
          <header className="topbar">
            <div className="topbar__who">
              {me && <AvatarView avatar={me.avatar} size="md" />}
              <div>
                <span className="muted">
                  {t('play.room')} {snapshot.code}
                </span>
                <div className="nickname">{me?.nickname}</div>
              </div>
            </div>
            <m.span
              key={me?.score ?? 0}
              className="pill pill--score"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={spring.pop}
            >
              {me?.score ?? 0} {t('common.points')}
            </m.span>
          </header>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        {/* mode="wait" — the outgoing phase clears before the next arrives, so a
            question never cross-fades over its own results. */}
        <AnimatePresence mode="wait">
          {snapshot.state === 'lobby' && (
            <m.section
              key="lobby"
              className="card card--center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Banner size="md" />
              <m.h2
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {t('play.youreIn')} 🎉
              </m.h2>
              <p className="muted">{t('play.waitingHost')}</p>
              <p className="pill">
                {players.length} {t('play.inRoom')}
              </p>
              <Button variant="ghost" onClick={() => setConfirmLeave(true)}>
                {t('play.leave')}
              </Button>
            </m.section>
          )}

          {isQuestion && (
            <m.section
              key={`q${question.index}`}
              className="playscreen__body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="playscreen__top">
                <span className="qmeta__count">
                  {question.index + 1} / {question.total}
                </span>
                <Timer seconds={seconds} ms={ms} total={question.timeLimitSec} />
              </div>
              <div className="playscreen__question">
                <h2 className="qtext">{question.text}</h2>
                {question.image && <QuestionMedia image={question.image} size="md" />}
              </div>
              <AnswerGrid
                options={question.options}
                picked={picked}
                disabled={seconds === 0}
                onPick={answer}
              />
              <AnimatePresence>
                {picked !== null && (
                  <m.p
                    className="muted lockedin"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    🔒 {t('play.lockedIn')}
                  </m.p>
                )}
              </AnimatePresence>
            </m.section>
          )}

          {snapshot.state === 'results' && results && (
            <m.section
              key={`r${results.index}`}
              className="card card--center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <Verdict
                correct={results.yourAnswer ? results.yourAnswer.correct : null}
                points={results.yourAnswer?.pointsAwarded ?? 0}
                streak={streak}
              />
              {question && (
                <p className="muted">
                  {t('play.answerIs')}: <strong>{question.options[results.correctIndex]}</strong>
                </p>
              )}
              <Leaderboard entries={results.leaderboard} limit={5} highlight={playerId.current} />
            </m.section>
          )}

          {snapshot.state === 'ended' && (
            <m.section
              key="ended"
              className="card card--center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2>{t('play.gameOver')}</h2>
              {coinsEarned !== null && (
                <m.span
                  className="cointoast"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={spring.pop}
                >
                  🪙 +{coinsEarned} {t('wallet.earned')}
                </m.span>
              )}
              <Podium entries={finalBoard ?? []} />
              <Leaderboard entries={finalBoard ?? []} highlight={playerId.current} />
              <Button variant="primary" size="lg" onClick={leave}>
                {t('play.backHome')}
              </Button>
            </m.section>
          )}
        </AnimatePresence>
      </main>
      <ConfirmDialog
        open={confirmLeave}
        title={t('play.confirmLeaveTitle')}
        body={t('play.confirmLeaveBody')}
        confirmLabel={t('play.confirmLeaveButton')}
        danger
        onConfirm={() => {
          setConfirmLeave(false);
          leave();
        }}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
