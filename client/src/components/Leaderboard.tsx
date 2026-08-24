import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { LeaderboardEntry } from '@ryzzquizz/shared';
import { REORDER_DELAY_MS, spring } from '../lib/motion.js';
import { useCountUp } from '../lib/useCountUp.js';
import { AvatarView } from './AvatarView.js';

const MEDALS = ['🥇', '🥈', '🥉'];

function Row({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const score = useCountUp(entry.score, 900);
  return (
    <m.li
      layout
      className={isMe ? 'is-me' : ''}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring.reorder}
    >
      <span className="leaderboard__rank">
        {MEDALS[entry.rank - 1] ?? entry.rank}
      </span>
      <AvatarView avatar={entry.avatar} size="sm" />
      <span className="leaderboard__name">{entry.nickname}</span>
      <span className="leaderboard__score">{score}</span>
    </m.li>
  );
}

export function Leaderboard({
  entries,
  limit,
  highlight,
}: {
  entries: LeaderboardEntry[];
  limit?: number;
  highlight?: string | null;
}) {
  // Hold the previous standings briefly so the verdict lands before the board
  // rearranges — the swap is the payoff, and it needs a beat of its own.
  const [shownEntries, setShownEntries] = useState(entries);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setShownEntries(entries);
      return;
    }
    const t = setTimeout(() => setShownEntries(entries), REORDER_DELAY_MS);
    return () => clearTimeout(t);
  }, [entries]);

  const shown = limit ? shownEntries.slice(0, limit) : shownEntries;
  if (shown.length === 0) return null;

  return (
    <ol className="leaderboard">
      <AnimatePresence initial={false}>
        {shown.map((e) => (
          <Row key={e.playerId} entry={e} isMe={e.playerId === highlight} />
        ))}
      </AnimatePresence>
    </ol>
  );
}
