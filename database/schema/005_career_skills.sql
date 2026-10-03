-- =====================================================================
-- SkillForge AI — Phase 4A database schema (Skill Intelligence)
-- Adds a reusable career -> required-skills mapping. Skill-gap analysis
-- is computed on the fly from this table + the existing `user_skills`
-- table, so there is nothing here that needs to be kept in sync by
-- hand when a user's profile changes.
-- Run with: psql "$DATABASE_URL" -f database/schema/005_career_skills.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- career_skill_requirements
-- One row per (career, skill): the level a student needs in that skill
-- to be considered ready for that career, plus how important the skill
-- is to that career (1 = low, 2 = medium, 3 = high). `career_title` is
-- free text on purpose (mirrors `career_goals.title`) so new careers
-- can be added later with a plain INSERT — no schema change needed.
-- Matching a user's free-text career goal to a `career_title` here is
-- done in the backend (see backend/src/utils/careerMatcher.js), not in
-- the database.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_skill_requirements (
  id             BIGSERIAL PRIMARY KEY,
  career_title   VARCHAR(160) NOT NULL,
  skill_id       BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  required_level SMALLINT NOT NULL CHECK (required_level BETWEEN 1 AND 5),
  importance     SMALLINT NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_career_skill_requirements UNIQUE (career_title, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_career_skill_requirements_career
  ON career_skill_requirements (career_title);
CREATE INDEX IF NOT EXISTS idx_career_skill_requirements_skill_id
  ON career_skill_requirements (skill_id);

COMMIT;
