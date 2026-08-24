import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import type { LeaderboardEntry } from '@ryzzquizz/shared';
import { spring } from '../lib/motion.js';
import { celebrateWin } from '../lib/celebrate.js';
import { useCountUp } from '../lib/useCountUp.js';
import { AvatarView } from './AvatarView.js';

// Visual order is 2nd · 1st · 3rd, so the winner stands in the middle.
const SLOTS = [1, 0, 2];
const HEIGHTS = ['62%', '100%', '46%'];

function Column({ entry, place }: { entry: LeaderboardEntry; place: number }) {
  const score = useCountUp(entry.score, 1100);
  return (
    <div className={`podium__slot podium__slot--${place}`}>
      <m.div
        className="podium__head"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + place * 0.12 }}
      >
        <span className="podium__avatarwrap">
          <AvatarView avatar={entry.avatar} size="lg" className="podium__avatar" />
          {place === 0 && (
            <m.span
              className="podium__crown"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ ...spring.pop, delay: 0.7 }}
            >
              👑
            </m.span>
          )}
        </span>
        <span className="podium__name">{entry.nickname}</span>
        <span className="podium__score">{score}</span>
      </m.div>
      <m.div
        className={`podium__column podium__column--${place}`}
        initial={{ height: 0 }}
        animate={{ height: HEIGHTS[place] }}
        transition={{ ...spring.podium, delay: 0.15 + place * 0.12 }}
      >
        <span className="podium__rank">{place + 1}</span>
      </m.div>
    </div>
  );
}

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top = entries.slice(0, 3);
  const fired = useRef(false);

  // Same StrictMode double-invoke guard as Verdict — celebrateWin() runs a
  // ~1.4s rAF confetti loop, so a doubled call means two overlapping loops
  // fighting each other instead of one clean finale.
  useEffect(() => {
    if (fired.current) return;
    if (top.length > 0) {
      fired.current = true;
      celebrateWin();
    }
  }, [top.length]);

  if (top.length === 0) return null;

  return (
    <div className="podium">
      {SLOTS.filter((i) => top[i]).map((i) => (
        <Column key={top[i].playerId} entry={top[i]} place={i} />
      ))}
    </div>
  );
}
