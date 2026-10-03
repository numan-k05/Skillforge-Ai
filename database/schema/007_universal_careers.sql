-- =====================================================================
-- SkillForge AI — Phase 5A database migration
-- UNIVERSAL CAREER EXPANSION
--
-- Adds a normalized, DB-driven career taxonomy so the platform is no
-- longer software/web-development-only:
--
--   career_categories   (Technology, Design & Creative, ...)
--   careers             (one row per career, belongs to a category)
--   career_aliases       (free-text variants that resolve to a career —
--                        replaces the hardcoded alias map that used to
--                        live in backend/src/utils/careerMatcher.js)
--   skill_categories     (Technical, Design, Marketing, Business, ...)
--   career_skills         (career <-> skill requirements, replaces
--                        career_skill_requirements going forward)
--
-- Nothing existing is dropped or destroyed:
--   - `career_skill_requirements` (Phase 4A) is left in place untouched
--     and its data is copied — not moved — into the new `career_skills`
--     table below, so it remains available as a historical record.
--   - `skills` keeps every existing column; this migration only adds
--     new, nullable ones.
--   - `career_goals` / `profiles.career_goal_id` (per-user free-text
--     career goal) is completely untouched. Resolving a user's career
--     goal against the new catalog happens in the backend (see
--     backend/src/utils/careerMatcher.js, Phase 5A version), not by
--     rewriting user data.
--
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING everywhere).
-- Run with: psql "$DATABASE_URL" -f database/schema/007_universal_careers.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- career_categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_categories (
  id             BIGSERIAL PRIMARY KEY,
  name           VARCHAR(120) NOT NULL UNIQUE,
  slug           VARCHAR(120) NOT NULL UNIQUE,
  description    TEXT,
  display_order  SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- careers
-- The canonical, DB-driven career catalog. New careers are added with a
-- plain INSERT — no backend deploy required.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS careers (
  id                 BIGSERIAL PRIMARY KEY,
  category_id        BIGINT NOT NULL REFERENCES career_categories (id) ON DELETE RESTRICT,
  title              VARCHAR(160) NOT NULL UNIQUE,
  slug               VARCHAR(160) NOT NULL UNIQUE,
  short_description  TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_careers_category_id ON careers (category_id);
CREATE INDEX IF NOT EXISTS idx_careers_is_active ON careers (is_active);

DROP TRIGGER IF EXISTS trg_careers_updated_at ON careers;
CREATE TRIGGER trg_careers_updated_at
  BEFORE UPDATE ON careers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- career_aliases
-- Free-text variants a student might type as their career goal
-- ("front end engineer", "ux designer") that should resolve to a given
-- career. Stored normalized (lowercase, trimmed) so lookups are a plain
-- equality match. This is what backend/src/utils/careerMatcher.js
-- queries instead of a hardcoded object.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_aliases (
  id          BIGSERIAL PRIMARY KEY,
  career_id   BIGINT NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
  alias       VARCHAR(160) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_aliases_career_id ON career_aliases (career_id);

-- ---------------------------------------------------------------------
-- skill_categories
-- Broad skill groupings usable across every career type (not just
-- software). `skills.category` (free text, Phase 2) is left as-is for
-- backward compatibility; `skills.skill_category_id` (added below)
-- links into this normalized table going forward.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- skills: extend in place (all new columns are nullable / defaulted so
-- every existing row stays valid with no backfill required to pass
-- constraints; the seed migration below backfills sensible values).
-- ---------------------------------------------------------------------
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS skill_category_id BIGINT REFERENCES skill_categories (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS skill_type VARCHAR(20) NOT NULL DEFAULT 'hard_skill'
    CHECK (skill_type IN ('hard_skill', 'soft_skill', 'tool')),
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_skills_skill_category_id ON skills (skill_category_id);
CREATE INDEX IF NOT EXISTS idx_skills_is_active ON skills (is_active);

-- ---------------------------------------------------------------------
-- career_skills
-- Normalized career <-> skill requirement, keyed by career_id instead
-- of the Phase 4A free-text career_title. Supports required /
-- recommended / optional skills, a minimum and target level, and both
-- an importance and a priority rating, per career.
--
--   skill_type:   'required' | 'recommended' | 'optional'
--   min_level:    the floor a student should already be at (1-5)
--   target_level: the level a student should reach to be "ready" (1-5)
--   importance:   how central this skill is to the career (1 low - 3 high)
--   priority:     suggested learning order/urgency (1 low - 3 high),
--                 feeds the Phase 6 roadmap sequencing
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_skills (
  id            BIGSERIAL PRIMARY KEY,
  career_id     BIGINT NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
  skill_id      BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  skill_type    VARCHAR(20) NOT NULL DEFAULT 'required'
    CHECK (skill_type IN ('required', 'recommended', 'optional')),
  min_level     SMALLINT NOT NULL DEFAULT 1 CHECK (min_level BETWEEN 1 AND 5),
  target_level  SMALLINT NOT NULL CHECK (target_level BETWEEN 1 AND 5),
  importance    SMALLINT NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  priority      SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_career_skills_career_skill UNIQUE (career_id, skill_id),
  CONSTRAINT chk_career_skills_levels CHECK (min_level <= target_level)
);

CREATE INDEX IF NOT EXISTS idx_career_skills_career_id ON career_skills (career_id);
CREATE INDEX IF NOT EXISTS idx_career_skills_skill_id ON career_skills (skill_id);

DROP TRIGGER IF EXISTS trg_career_skills_updated_at ON career_skills;
CREATE TRIGGER trg_career_skills_updated_at
  BEFORE UPDATE ON career_skills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
