-- =====================================================================
-- SkillForge AI — Phase 2 database schema
-- Tables: users, profiles, skills, user_skills, career_goals
-- Run with: psql "$DATABASE_URL" -f database/schema/001_init.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Helper: keep `updated_at` current on every UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_format_chk CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT users_name_length_chk CHECK (char_length(btrim(name)) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- career_goals
-- A user can record several goals over time; a profile points at the
-- one that is currently active.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_goals (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       VARCHAR(160) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT career_goals_title_length_chk CHECK (char_length(btrim(title)) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals (user_id);
-- One row per (user, title) so re-selecting the same goal reuses it
-- instead of creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS uq_career_goals_user_title ON career_goals (user_id, title);

DROP TRIGGER IF EXISTS trg_career_goals_updated_at ON career_goals;
CREATE TRIGGER trg_career_goals_updated_at
  BEFORE UPDATE ON career_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- profiles
-- One-to-one with users. Holds the academic/profile fields plus a
-- pointer at the user's current career goal.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  university     VARCHAR(200),
  degree         VARCHAR(200),
  semester       SMALLINT CHECK (semester IS NULL OR (semester BETWEEN 1 AND 20)),
  career_goal_id BIGINT REFERENCES career_goals (id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_career_goal_id ON profiles (career_goal_id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- skills
-- Global catalog of skills (shared across all users).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  category    VARCHAR(80),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);

-- ---------------------------------------------------------------------
-- user_skills
-- Join table: a user's proficiency in a given skill (0-5 scale, per
-- the skill-intelligence model described in the README).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  skill_id          BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  proficiency_level SMALLINT NOT NULL DEFAULT 0 CHECK (proficiency_level BETWEEN 0 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_skills_user_skill UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills (skill_id);

DROP TRIGGER IF EXISTS trg_user_skills_updated_at ON user_skills;
CREATE TRIGGER trg_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
