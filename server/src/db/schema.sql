-- RyzzQuizz — full reference schema (PostgreSQL), starting from CREATE DATABASE.
--
-- This is a read-for-the-whole-picture snapshot, not what actually runs.
-- What's real vs. reference:
--   * `users`   — LIVE. Mirrors server/src/db/migrations/0001 + 0002. Those
--                 migrations (applied via `npm run db:migrate`) are the source
--                 of truth; keep this copy in sync by hand if they change.
--   * everything below `users` — NOT YET WIRED. No migration or code touches
--     these tables today; live room/session/game state is entirely in-memory
--     (server/src/services/roomService.ts). This is what a future "persist
--     quizzes + finished-game history" phase would apply as its own
--     migration(s) — not something to build speculatively ahead of that.
--
-- Deliberately no FK from quizzes/games to users yet — quiz ownership and
-- "my game history" are their own future phase, not bolted on here early.
--
-- On a hosted provider (Supabase, etc.) the database already exists, so skip
-- the CREATE DATABASE and just run the rest against it.

-- CREATE DATABASE ryzzquizz;
-- \c ryzzquizz

-- ===== Accounts (live) =====

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  username      VARCHAR(24)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- Permissions. Never derived from user_type.
  system_role   TEXT         NOT NULL DEFAULT 'USER'
                  CHECK (system_role IN ('USER', 'ADMIN', 'DEVELOPER')),
  -- Personalization only. Grants nothing.
  user_type     TEXT         NOT NULL DEFAULT 'STUDENT'
                  CHECK (user_type IN ('STUDENT', 'TEACHER', 'PROFESSIONAL', 'FRIENDS_FAMILY')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email)
);

-- Postgres has no ON UPDATE CURRENT_TIMESTAMP; this trigger supplies it.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ===== Quiz content + game history (reference only — not yet wired) =====

CREATE TABLE IF NOT EXISTS quizzes (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  title      VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  quiz_id        CHAR(36)     NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position       INT          NOT NULL,
  text           VARCHAR(500) NOT NULL,
  options        JSONB        NOT NULL,
  correct_index  SMALLINT     NOT NULL,
  time_limit_sec SMALLINT     NOT NULL DEFAULT 20,
  CONSTRAINT uq_quiz_position UNIQUE (quiz_id, position)
);

CREATE TABLE IF NOT EXISTS games (
  id         CHAR(36)    NOT NULL PRIMARY KEY,
  quiz_id    CHAR(36)    NOT NULL REFERENCES quizzes(id),
  room_code  CHAR(6)     NOT NULL,
  started_at TIMESTAMPTZ NULL,
  ended_at   TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games (room_code);

CREATE TABLE IF NOT EXISTS game_players (
  id       CHAR(36)    NOT NULL PRIMARY KEY,
  game_id  CHAR(36)    NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  nickname VARCHAR(16) NOT NULL,
  score    INT         NOT NULL DEFAULT 0,
  CONSTRAINT uq_game_nickname UNIQUE (game_id, nickname)
);

CREATE TABLE IF NOT EXISTS answers (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  game_id        CHAR(36) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id      CHAR(36) NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  question_id    CHAR(36) NOT NULL REFERENCES questions(id),
  option_index   SMALLINT NOT NULL,
  answered_at    BIGINT   NOT NULL,
  correct        BOOLEAN  NOT NULL,
  points_awarded INT      NOT NULL,
  -- Enforces one answer per player per question at the storage layer too.
  CONSTRAINT uq_player_question UNIQUE (player_id, question_id)
);
