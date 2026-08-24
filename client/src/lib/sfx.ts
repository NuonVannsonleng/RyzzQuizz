import { getSettings } from './settings.js';

// Synthesized beeps via the Web Audio oscillator — no sound files to host,
// consistent with the rest of the app's zero-asset approach. Every call
// checks the user's sound setting itself, so call sites never need an `if`.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  // Browsers suspend audio contexts created before a user gesture; every SFX
  // call happens after a click/keypress, so resuming here is always allowed.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.08): void {
  if (!getSettings().sound) return;
  const audioCtx = getContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.value = gain;
  // Quick fade-out so every beep ends cleanly instead of clicking off.
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);

  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + durationMs / 1000);
}

export function sfxTick(): void {
  beep(880, 60, 'square', 0.04);
}

export function sfxCorrect(): void {
  beep(660, 90);
  setTimeout(() => beep(990, 140), 90);
}

export function sfxIncorrect(): void {
  beep(220, 220, 'sawtooth', 0.05);
}

export function sfxCountdownUrgent(): void {
  beep(440, 90, 'square', 0.05);
}

export function sfxStart(): void {
  beep(523, 90);
  setTimeout(() => beep(659, 90), 90);
  setTimeout(() => beep(784, 160), 180);
}
