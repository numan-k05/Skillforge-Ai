-- =====================================================================
-- SkillForge AI — Phase 8A database schema (Progress Tracking)
-- Adds a unified, append-only history of meaningful progress events.
-- Existing feature tables remain the source of truth for current status.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS progress_events (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type   VARCHAR(40) NOT NULL,
  entity_type  VARCHAR(40) NOT NULL,
  entity_id    BIGINT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT progress_events_type_chk CHECK (
    event_type IN ('roadmap_item_completed','project_completed','mission_completed','challenge_completed','skill_level_increased')
  )
);

CREATE INDEX IF NOT EXISTS idx_progress_events_user_time
  ON progress_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_events_user_type
  ON progress_events(user_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_events_entity
  ON progress_events(entity_type, entity_id);

-- One completion/increase event per user/entity/type. This prevents duplicate
-- history entries when an existing endpoint is called repeatedly.
CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_events_completion
  ON progress_events(user_id, event_type, entity_type, entity_id);

-- ---------------------------------------------------------------------
-- Event helpers/triggers. Current status remains in the original tables;
-- these triggers only append a history record when meaningful progress occurs.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_progress_event(
  p_user_id BIGINT,
  p_event_type VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id BIGINT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  INSERT INTO progress_events(user_id, event_type, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_event_type, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT (user_id, event_type, entity_type, entity_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_progress_roadmap_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM record_progress_event(
      (SELECT r.user_id FROM roadmaps r
       JOIN roadmap_phases rp ON rp.roadmap_id = r.id
       WHERE rp.id = NEW.phase_id),
      'roadmap_item_completed', 'roadmap_item', NEW.id,
      jsonb_build_object('title', NEW.title, 'skill_id', NEW.skill_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_roadmap_item ON roadmap_items;
CREATE TRIGGER trg_progress_roadmap_item
AFTER UPDATE OF status ON roadmap_items
FOR EACH ROW EXECUTE FUNCTION trg_progress_roadmap_item();

CREATE OR REPLACE FUNCTION trg_progress_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM record_progress_event(
      NEW.user_id, 'project_completed', 'project', NEW.project_id,
      jsonb_build_object('user_project_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_project ON user_projects;
CREATE TRIGGER trg_progress_project
AFTER UPDATE OF status ON user_projects
FOR EACH ROW EXECUTE FUNCTION trg_progress_project();

CREATE OR REPLACE FUNCTION trg_progress_mission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM record_progress_event(
      NEW.user_id, 'mission_completed', 'mission', NEW.id,
      jsonb_build_object('mission_date', NEW.mission_date, 'title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_mission ON daily_missions;
CREATE TRIGGER trg_progress_mission
AFTER UPDATE OF status ON daily_missions
FOR EACH ROW EXECUTE FUNCTION trg_progress_mission();

CREATE OR REPLACE FUNCTION trg_progress_challenge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM record_progress_event(
      NEW.user_id, 'challenge_completed', 'challenge', NEW.challenge_id,
      jsonb_build_object('attempts_count', NEW.attempts_count)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_challenge ON user_challenge_progress;
CREATE TRIGGER trg_progress_challenge
AFTER UPDATE OF status ON user_challenge_progress
FOR EACH ROW EXECUTE FUNCTION trg_progress_challenge();

CREATE OR REPLACE FUNCTION trg_progress_skill()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proficiency_level > OLD.proficiency_level THEN
    PERFORM record_progress_event(
      NEW.user_id, 'skill_level_increased', 'skill', NEW.skill_id,
      jsonb_build_object('from_level', OLD.proficiency_level, 'to_level', NEW.proficiency_level)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_skill ON user_skills;
CREATE TRIGGER trg_progress_skill
AFTER UPDATE OF proficiency_level ON user_skills
FOR EACH ROW EXECUTE FUNCTION trg_progress_skill();

COMMIT;
