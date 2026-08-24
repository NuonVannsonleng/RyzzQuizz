const BASE_POINTS = 1000;
const SPEED_WEIGHT = 0.5; // half the points are the speed bonus

/** Correct answers earn base points plus a bonus that decays linearly over the time limit. */
export function scoreAnswer(
  correct: boolean,
  answeredAt: number,
  startedAt: number,
  timeLimitSec: number,
): number {
  if (!correct) return 0;
  const elapsed = Math.max(0, answeredAt - startedAt);
  const limit = timeLimitSec * 1000;
  const remaining = Math.max(0, 1 - elapsed / limit);
  return Math.round(BASE_POINTS * (1 - SPEED_WEIGHT + SPEED_WEIGHT * remaining));
}
