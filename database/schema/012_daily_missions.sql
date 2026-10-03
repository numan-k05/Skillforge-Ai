-- Phase 7C: Daily Missions
-- User-scoped daily action plans generated from the user's career, skill gaps,
-- and project progress. Safe to re-run.

CREATE TABLE IF NOT EXISTS daily_missions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  mission_order INTEGER NOT NULL CHECK (mission_order > 0),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  mission_type VARCHAR(30) NOT NULL CHECK (mission_type IN ('learn', 'practice', 'build', 'review', 'challenge')),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes BETWEEN 5 AND 240),
  skill_id BIGINT REFERENCES skills(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_date, mission_order)
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date
  ON daily_missions(user_id, mission_date DESC, mission_order);
CREATE INDEX IF NOT EXISTS idx_daily_missions_skill
  ON daily_missions(skill_id);
CREATE INDEX IF NOT EXISTS idx_daily_missions_project
  ON daily_missions(project_id);

CREATE OR REPLACE FUNCTION set_daily_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_missions_updated_at ON daily_missions;
CREATE TRIGGER trg_daily_missions_updated_at
BEFORE UPDATE ON daily_missions
FOR EACH ROW EXECUTE FUNCTION set_daily_missions_updated_at();
