import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { canUseDevTools, type SystemRole, type UserType } from '@ryzzquizz/shared';
import { getUserById, type AuthUser } from '../services/authService.js';

const INSECURE_DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET ?? INSECURE_DEFAULT_SECRET;
export const AUTH_COOKIE_NAME = 'ryzzquizz_token';
const TOKEN_TTL = '7d';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

if (JWT_SECRET === INSECURE_DEFAULT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set — using an insecure default in production.');
}

interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  systemRole: SystemRole;
  userType: UserType;
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    systemRole: user.systemRole,
    userType: user.userType,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME);
}

/** Verifies a raw token string. Shared by the Express and socket.io paths. */
export function verifyToken(token: string | undefined): AuthUser | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      systemRole: payload.systemRole,
      userType: payload.userType,
    };
  } catch {
    return null;
  }
}

/**
 * The token's own copy of the user — fine for display (greeting, nav links),
 * but it's a snapshot: a role changed after the token was minted won't show up
 * here until the next login. Anything that *grants* something must use
 * requireDeveloperRole() below instead.
 */
export function readUserFromRequest(req: Request): AuthUser | null {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  return verifyToken(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = readUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  (req as Request & { user: AuthUser }).user = user;
  next();
}

/**
 * Authoritative privilege check — re-reads the role from the database instead
 * of trusting the token, so revoking DEVELOPER takes effect immediately rather
 * than whenever the user's 7-day token happens to expire.
 */
export async function hasDevToolsAccess(user: AuthUser | null): Promise<boolean> {
  if (!user) return false;
  const fresh = await getUserById(user.id);
  return !!fresh && canUseDevTools(fresh.systemRole);
}
