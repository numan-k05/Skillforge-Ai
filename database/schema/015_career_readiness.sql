-- Phase 8C: historical, user-owned career-readiness measurements.
-- The existing skill analysis remains the source of truth for each score.
BEGIN;

CREATE TABLE IF NOT EXISTS career_readiness_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  career_title VARCHAR(255) NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_readiness_snapshots_user_time
  ON career_readiness_snapshots(user_id, measured_at DESC);

COMMIT;
