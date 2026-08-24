import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SystemRole, UserType } from '@ryzzquizz/shared';
import { socket } from './socket.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  /** Permissions. Never derived from userType. */
  systemRole: SystemRole;
  /** Personalization only — how they said they'd use RyzzQuizz. */
  userType: UserType;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True only during the initial /api/auth/me check on mount. */
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, userType: UserType) => Promise<void>;
  setUserType: (userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  return fallback;
}

async function postJson<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorMessage(data, fallback));
  return data as T;
}

/**
 * Cookie-based, not localStorage — the JWT lives in an httpOnly cookie the
 * server sets, so this only ever mirrors server state, never owns it.
 * Additive to the app: nothing here gates hosting or joining a game.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<AuthUser>) : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // The socket captures identity from the cookie at connect time, so a stale
  // connection would still look logged-out (or still-privileged) after an auth
  // change. Dropping it here forces the next connect() to re-handshake.
  const resetSocketIdentity = useCallback(() => {
    if (socket.connected) socket.disconnect();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const data = await postJson<AuthUser>('/api/auth/login', { emailOrUsername, password }, 'Could not log you in');
    resetSocketIdentity();
    setUser(data);
  }, [resetSocketIdentity]);

  const register = useCallback(
    async (username: string, email: string, password: string, userType: UserType) => {
      const data = await postJson<AuthUser>(
        '/api/auth/register',
        { username, email, password, userType },
        'Could not create your account',
      );
      resetSocketIdentity();
      setUser(data);
    },
    [resetSocketIdentity],
  );

  const setUserTypeRemote = useCallback(async (userType: UserType) => {
    const data = await postJson<AuthUser>('/api/auth/user-type', { userType }, 'Could not save that');
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    resetSocketIdentity();
    setUser(null);
  }, [resetSocketIdentity]);

  const value = useMemo(
    () => ({ user, loading, login, register, setUserType: setUserTypeRemote, logout }),
    [user, loading, login, register, setUserTypeRemote, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
