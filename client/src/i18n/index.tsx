import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { en, type Dict } from './en.js';
import { km } from './km.js';

export type Lang = 'en' | 'km';
const STORAGE_KEY = 'ryzzquizz:lang';
const DICTS: Record<Lang, Dict> = { en, km };

// Dotted-path key over the dictionary shape, e.g. "home.tagline" — gives
// autocomplete + a compile error on a typo instead of a silent blank label.
type PathOf<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : PathOf<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type TKey = PathOf<Dict>;

function resolve(dict: Dict, path: string): string {
  return path.split('.').reduce<unknown>((node, key) => (node as never)?.[key], dict) as string;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'km';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'km') return saved;
  return 'km'; // Cambodian curriculum app — Khmer first for a first-time visitor.
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) =>
      interpolate(resolve(DICTS[lang], key), vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
