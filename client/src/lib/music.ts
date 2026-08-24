import { getSettings, SETTINGS_CHANGED_EVENT } from './settings.js';

// Three CC0 tracks (opengameart.org), downloaded once into public/audio so
// playback never depends on a third party's uptime. See public/audio/CREDITS.txt.
export type MusicKey = 'menu' | 'game' | 'victory';

const SRC: Record<MusicKey, string> = {
  menu: '/audio/menu.mp3',
  game: '/audio/game.mp3',
  victory: '/audio/victory.mp3',
};

// Victory is a short fanfare, not a loop bed — it plays once, then ambience
// falls back to the menu track so the podium screen doesn't loop a 4s jingle.
const LOOP: Record<MusicKey, boolean> = { menu: true, game: true, victory: false };

const VOLUME = 0.28;
const FADE_MS = 450;

let el: HTMLAudioElement | null = null;
let current: MusicKey | null = null;
let fadeHandle: number | null = null;

function getEl(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = 'auto';
  }
  return el;
}

function clearFade(): void {
  if (fadeHandle !== null) {
    cancelAnimationFrame(fadeHandle);
    fadeHandle = null;
  }
}

// rAF + elapsed-time interpolation rather than setInterval — a fixed-step
// timer drifts (and can stall outright) under the same main-thread jank this
// whole pass is trying to fix, where rAF just skips frames and stays in sync.
function fadeTo(target: number, onDone?: () => void): void {
  clearFade();
  const audio = getEl();
  const start = audio.volume;
  const delta = target - start;
  if (delta === 0) {
    onDone?.();
    return;
  }
  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / FADE_MS);
    audio.volume = Math.max(0, Math.min(1, start + delta * t));
    if (t >= 1) {
      fadeHandle = null;
      onDone?.();
    } else {
      fadeHandle = requestAnimationFrame(step);
    }
  };
  fadeHandle = requestAnimationFrame(step);
}

function applyMuteState(): void {
  const audio = getEl();
  if (!getSettings().music) {
    fadeTo(0, () => audio.pause());
  } else if (current) {
    if (audio.paused) void audio.play().catch(() => {});
    fadeTo(VOLUME);
  }
}

/** Switches the background track, fading out the old one and in the new. No-op if already playing `key`. */
export function playMusic(key: MusicKey): void {
  if (current === key) return;
  current = key;

  const audio = getEl();
  if (!getSettings().music) return; // stays paused; applyMuteState() will pick it up if music gets turned on

  const swap = () => {
    audio.src = SRC[key];
    audio.loop = LOOP[key];
    audio.volume = 0;
    audio.onended = LOOP[key]
      ? null
      : () => {
          // Fanfare finished — settle back into ambience.
          if (current === key) playMusic('menu');
        };
    void audio.play().catch(() => {
      // Blocked until a user gesture; the App-level unlock listener retries on first click.
    });
    fadeTo(VOLUME);
  };

  if (audio.paused || audio.volume === 0) swap();
  else fadeTo(0, swap);
}

export function stopMusic(): void {
  current = null;
  const audio = getEl();
  fadeTo(0, () => audio.pause());
}

let unlocked = false;
let armed = false;

/** Autoplay is blocked until a real user gesture — call once at app mount. */
export function primeMusicOnFirstGesture(): void {
  if (unlocked || armed) return;
  armed = true;
  const unlock = () => {
    unlocked = true;
    const audio = getEl();
    if (current && getSettings().music && audio.paused) {
      void audio.play().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

window.addEventListener(SETTINGS_CHANGED_EVENT, applyMuteState);
