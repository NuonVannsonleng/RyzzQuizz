import type { Transition } from 'motion/react';

// Shared motion vocabulary — every animated moment pulls from here so the app
// reads as one system rather than seven separate ideas.

export const spring = {
  /** Lobby chips, answer tiles — snappy with a little overshoot. */
  pop: { type: 'spring', stiffness: 500, damping: 30 } satisfies Transition,
  /** Leaderboard rows sliding past each other. */
  reorder: { type: 'spring', stiffness: 350, damping: 32 } satisfies Transition,
  /** Podium columns rising — heavier, more ceremony. */
  podium: { type: 'spring', stiffness: 260, damping: 24 } satisfies Transition,
} as const;

export const ease = {
  /** Expo-out: fast start, long settle. Default for entrances. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric, for things that move both ways. */
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.24,
  slow: 0.4,
  reveal: 0.5,
} as const;

/** Delay before the board reorders, so the verdict reads first. */
export const REORDER_DELAY_MS = 700;
