import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DEFAULT_USER_TYPE, isUserType, type SystemRole, type UserType } from '@ryzzquizz/shared';
import { pool } from '../db/pool.js';

export class UserError extends Error {}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  systemRole: SystemRole;
  userType: UserType;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  system_role: SystemRole;
  user_type: UserType;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;
// Never reveal which half of "email/username or password" was wrong — that's
// an account-enumeration leak.
const BAD_LOGIN = 'Invalid email/username or password.';
/** Postgres unique_violation. */
const PG_UNIQUE_VIOLATION = '23505';

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    systemRole: row.system_role,
    userType: row.user_type,
  };
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  userType: unknown,
): Promise<AuthUser> {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!USERNAME_RE.test(cleanUsername)) {
    throw new UserError('Username must be 3-24 characters: letters, numbers, underscore.');
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    throw new UserError('Enter a valid email address.');
  }
  if (password.length < 8) {
    throw new UserError('Password must be at least 8 characters.');
  }

  // Anything unrecognised falls back to the default rather than erroring —
  // user_type is a personalization hint, not a permission, so a bad value is
  // never a security question. system_role is NEVER taken from the request:
  // every signup is a plain USER, and promotion is a separate admin action.
  const type: UserType = isUserType(userType) ? userType : DEFAULT_USER_TYPE;

  // A pre-check for a friendlier error message; the UNIQUE constraint below
  // is the real guard against two signups for the same name landing at once.
  const existing = await pool.query<UserRow>(
    'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [cleanUsername, cleanEmail],
  );
  if (existing.rows.length > 0) {
    throw new UserError('That username or email is already taken.');
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, system_role, user_type) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, cleanUsername, cleanEmail, passwordHash, 'USER', type],
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new UserError('That username or email is already taken.');
    throw err;
  }

  return { id, username: cleanUsername, email: cleanEmail, systemRole: 'USER', userType: type };
}

export async function verifyLogin(emailOrUsername: string, password: string): Promise<AuthUser> {
  const identifier = emailOrUsername.trim();
  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, email, password_hash, system_role, user_type FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [identifier, identifier.toLowerCase()],
  );
  const row = rows[0];
  if (!row) throw new UserError(BAD_LOGIN);

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new UserError(BAD_LOGIN);

  return toAuthUser(row);
}

/**
 * Authoritative role lookup. Privileged checks go through this rather than
 * trusting the JWT copy — a token minted before a demotion would otherwise
 * keep working until it expired.
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, email, password_hash, system_role, user_type FROM users WHERE id = $1 LIMIT 1',
    [id],
  );
  return rows[0] ? toAuthUser(rows[0]) : null;
}

export async function setUserType(id: string, userType: UserType): Promise<void> {
  await pool.query('UPDATE users SET user_type = $1 WHERE id = $2', [userType, id]);
}
