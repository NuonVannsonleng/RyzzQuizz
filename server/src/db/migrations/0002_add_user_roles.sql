-- TEXT + CHECK rather than a Postgres ENUM type: adding a value to an enum is
-- an ALTER TYPE that can't run inside some transaction contexts, whereas
-- widening a CHECK is a plain, reversible migration.
--
-- system_role is permissions, user_type is personalization. They stay in
-- separate columns on purpose — see shared/src/auth.ts.
ALTER TABLE users
  ADD COLUMN system_role TEXT NOT NULL DEFAULT 'USER'
    CONSTRAINT users_system_role_check CHECK (system_role IN ('USER', 'ADMIN', 'DEVELOPER')),
  ADD COLUMN user_type TEXT NOT NULL DEFAULT 'STUDENT'
    CONSTRAINT users_user_type_check CHECK (user_type IN ('STUDENT', 'TEACHER', 'PROFESSIONAL', 'FRIENDS_FAMILY'));
