-- =====================================================================
-- SkillForge AI — Phase 3 database schema (onboarding + user profile)
-- Adds onboarding fields to `profiles`, plus an `interests` catalog and
-- a `user_interests` join table.
-- Run with: psql "$DATABASE_URL" -f database/schema/003_onboarding.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- profiles: new onboarding-related columns
-- ---------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country VARCHAR(120),
  ADD COLUMN IF NOT EXISTS weekly_hours_available SMALLINT
    CHECK (weekly_hours_available IS NULL OR weekly_hours_available BETWEEN 1 AND 168),
  ADD COLUMN IF NOT EXISTS learning_goals TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- interests
-- Global catalog of interests (shared across all users), mirrors the
-- `skills` catalog pattern from Phase 2. Custom interests a user types
-- in during onboarding are added here too (category = 'Custom').
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interests (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  category    VARCHAR(80),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interests_category ON interests (category);

-- ---------------------------------------------------------------------
-- user_interests
-- Join table: which interests a user selected during onboarding.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_interests (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  interest_id BIGINT NOT NULL REFERENCES interests (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_interests_user_interest UNIQUE (user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests (interest_id);

COMMIT;
