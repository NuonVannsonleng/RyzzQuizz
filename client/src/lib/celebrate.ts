import confetti from 'canvas-confetti';

// Confetti is decoration, never information — every call is a no-op under
// prefers-reduced-motion, and nothing in the UI depends on it having fired.

const OPTION_COLORS = ['#e84855', '#3a86ff', '#f9a03f', '#2ec4b6', '#6c5ce7'];

function motionOk(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Small burst behind a correct answer. */
export function celebrateCorrect(): void {
  if (!motionOk()) return;
  confetti({
    particleCount: 70,
    spread: 62,
    startVelocity: 34,
    origin: { y: 0.62 },
    colors: OPTION_COLORS,
    disableForReducedMotion: true,
  });
}

/** Bigger, two-sided finale for the podium. */
export function celebrateWin(): void {
  if (!motionOk()) return;
  const ends = Date.now() + 1400;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors: OPTION_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors: OPTION_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < ends) requestAnimationFrame(frame);
  };

  frame();
}
