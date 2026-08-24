import { useEffect, useState } from 'react';

// Same localStorage + custom-event pattern as wallet.ts — small, synchronous,
// no need for a context provider for state this simple.

const KEY = 'ryzzquizz:settings';
export const SETTINGS_CHANGED_EVENT = 'ryzzquizz:settings-changed';
const EVENT = SETTINGS_CHANGED_EVENT;

export interface Settings {
  /** null = follow the OS's prefers-reduced-motion; true/false is an explicit in-app override. */
  reducedMotion: boolean | null;
  sound: boolean;
  /** Background music, separate from SFX — players often want one without the other. */
  music: boolean;
}

const DEFAULTS: Settings = { reducedMotion: null, sound: true, music: true };

function read(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : null,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
      music: typeof parsed.music === 'boolean' ? parsed.music : true,
    };
  } catch {
    return DEFAULTS;
  }
}

function write(next: Settings): void {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getSettings(): Settings {
  return read();
}

export function setReducedMotion(value: boolean | null): void {
  write({ ...read(), reducedMotion: value });
}

export function setSound(value: boolean): void {
  write({ ...read(), sound: value });
}

export function setMusic(value: boolean): void {
  write({ ...read(), music: value });
}

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(() => read());

  useEffect(() => {
    const onChange = () => setSettings(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return settings;
}
