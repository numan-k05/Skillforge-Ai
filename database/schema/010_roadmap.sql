-- =====================================================================
-- SkillForge AI — Phase 6A database schema (Personalized Roadmap)
-- Adds the backend/database foundation for a per-user, per-career
-- learning roadmap:
--
--   roadmaps         (one row per generated roadmap version)
--   roadmap_phases   (ordered stages within a roadmap)
--   roadmap_items    (learning/practice/project/assessment items within
--                     a phase, optionally tied to a specific skill)
--
-- This migration does NOT touch any existing table. It only adds three
-- new tables plus their indexes/triggers.
--
-- The roadmap engine (backend/src/services/roadmapService.js) is a
-- CONSUMER of the existing skill-gap analysis
-- (skillAnalysisService.js) — it does not recompute skill gaps itself,
-- so nothing here duplicates `career_skills` / `user_skills` data. The
-- roadmap tables store the *plan* generated from that analysis, plus a
-- few point-in-time snapshot fields (career_title, weekly_hours) so a
-- saved roadmap still reads sensibly even if the user's profile or the
-- career catalog changes later.
--
-- Safe to re-run (CREATE TABLE IF NOT EXISTS / IF NOT EXISTS indexes).
-- Run with: psql "$DATABASE_URL" -f database/schema/010_roadmap.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- roadmaps
-- One row per generated roadmap. A user can have many roadmaps over
-- time (history of regenerations), but at most one with status
-- 'active' at a time — enforced by the partial unique index below.
--
-- `career_id` links to the live `careers` catalog row (nullable so a
-- roadmap survives a career later being deactivated); `career_title`
-- is a snapshot of the resolved career title at generation time, so
-- the roadmap always displays correctly even if `career_id` becomes
-- null. `weekly_hours` is likewise a snapshot of the profile's
-- `weekly_hours_available` used to build this specific version.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmaps (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  career_id     BIGINT REFERENCES careers (id) ON DELETE SET NULL,
  career_title  VARCHAR(160) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  target_weeks  SMALLINT CHECK (target_weeks IS NULL OR target_weeks BETWEEN 1 AND 260),
  weekly_hours  SMALLINT CHECK (weekly_hours IS NULL OR weekly_hours BETWEEN 1 AND 168),
  version       SMALLINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps (user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_career_id ON roadmaps (career_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps (status);

-- At most one active roadmap per user. The service layer archives any
-- existing active roadmap in the same transaction before inserting a
-- new one (see roadmapModel.saveGeneratedRoadmap), so this index is a
-- safety net against a race, not the primary mechanism.
CREATE UNIQUE INDEX IF NOT EXISTS uq_roadmaps_one_active_per_user
  ON roadmaps (user_id)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS trg_roadmaps_updated_at ON roadmaps;
CREATE TRIGGER trg_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- roadmap_phases
-- Ordered stages within a roadmap (e.g. "Foundations", "Strengthen
-- Developing Skills", "Apply Your Skills", "Validate Readiness").
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id               BIGSERIAL PRIMARY KEY,
  roadmap_id       BIGINT NOT NULL REFERENCES roadmaps (id) ON DELETE CASCADE,
  phase_order      SMALLINT NOT NULL CHECK (phase_order >= 1),
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  estimated_weeks  SMALLINT CHECK (estimated_weeks IS NULL OR estimated_weeks BETWEEN 1 AND 104),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_roadmap_phases_order UNIQUE (roadmap_id, phase_order)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_phases_roadmap_id ON roadmap_phases (roadmap_id);

DROP TRIGGER IF EXISTS trg_roadmap_phases_updated_at ON roadmap_phases;
CREATE TRIGGER trg_roadmap_phases_updated_at
  BEFORE UPDATE ON roadmap_phases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- roadmap_items
-- A single learning/practice/project/assessment item within a phase.
-- `skill_id` is nullable: most items (learning/practice) target one
-- specific skill, but a capstone project or a readiness-assessment
-- item may span several skills, in which case it's described in
-- `description` rather than tied to a single FK.
--
-- `status` is intentionally minimal (pending/in_progress/completed/
-- skipped) — full progress tracking (streaks, completion %, etc.) is
-- out of scope for Phase 6A and belongs to a later phase.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmap_items (
  id               BIGSERIAL PRIMARY KEY,
  phase_id         BIGINT NOT NULL REFERENCES roadmap_phases (id) ON DELETE CASCADE,
  skill_id         BIGINT REFERENCES skills (id) ON DELETE SET NULL,
  item_order       SMALLINT NOT NULL CHECK (item_order >= 1),
  item_type        VARCHAR(20) NOT NULL
    CHECK (item_type IN ('learning', 'practice', 'project', 'assessment')),
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  priority         VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  estimated_hours  SMALLINT CHECK (estimated_hours IS NULL OR estimated_hours BETWEEN 1 AND 500),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  resource_note    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_roadmap_items_order UNIQUE (phase_id, item_order)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase_id ON roadmap_items (phase_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_skill_id ON roadmap_items (skill_id);

DROP TRIGGER IF EXISTS trg_roadmap_items_updated_at ON roadmap_items;
CREATE TRIGGER trg_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
