import { useEffect, useState } from 'react';
import { DEFAULT_AVATAR, sanitizeAvatar, type PlayerAvatar } from '@ryzzquizz/shared';

// Coins and owned cosmetics are a client-only meta-layer — there's no account
// system, so the wallet lives in localStorage per browser. The server only
// ever sees the resulting avatar shape (sanitizeAvatar), never the wallet.

const KEY = 'ryzzquizz:wallet';
const EVENT = 'ryzzquizz:wallet-changed';
const STARTING_COINS = 80;

export interface WalletState {
  coins: number;
  owned: string[];
  avatar: PlayerAvatar;
}

function read(): WalletState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { coins: STARTING_COINS, owned: [], avatar: DEFAULT_AVATAR };
    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? parsed.coins : STARTING_COINS,
      owned: Array.isArray(parsed.owned) ? parsed.owned.filter((id) => typeof id === 'string') : [],
      avatar: sanitizeAvatar(parsed.avatar),
    };
  } catch {
    return { coins: STARTING_COINS, owned: [], avatar: DEFAULT_AVATAR };
  }
}

function write(state: WalletState): void {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getWallet(): WalletState {
  return read();
}

export function earnCoins(amount: number): WalletState {
  const state = read();
  const next = { ...state, coins: state.coins + amount };
  write(next);
  return next;
}

/** Returns null (and spends nothing) if already owned or unaffordable. */
export function buyItem(itemId: string, cost: number): WalletState | null {
  const state = read();
  if (state.owned.includes(itemId) || state.coins < cost) return null;
  const next = { ...state, coins: state.coins - cost, owned: [...state.owned, itemId] };
  write(next);
  return next;
}

export function setAvatar(patch: Partial<PlayerAvatar>): WalletState {
  const state = read();
  const next = { ...state, avatar: sanitizeAvatar({ ...state.avatar, ...patch }) };
  write(next);
  return next;
}

/** Reactive wallet — re-reads on same-tab changes (custom event) and cross-tab changes (storage event). */
export function useWallet(): WalletState {
  const [state, setState] = useState<WalletState>(() => read());

  useEffect(() => {
    const onChange = () => setState(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return state;
}
