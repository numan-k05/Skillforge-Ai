BEGIN;

CREATE TABLE IF NOT EXISTS learning_resources (
  id              BIGSERIAL PRIMARY KEY,
  skill_id        BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  title           VARCHAR(240) NOT NULL,
  description     TEXT,
  provider        VARCHAR(160) NOT NULL,
  resource_type   VARCHAR(20) NOT NULL CHECK (resource_type IN ('course', 'documentation', 'video', 'tutorial', 'practice', 'project')),
  url             TEXT NOT NULL CHECK (url ~* '^https://'),
  difficulty      VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours SMALLINT CHECK (estimated_hours IS NULL OR estimated_hours BETWEEN 1 AND 1000),
  is_free         BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_learning_resources_skill_url UNIQUE (skill_id, url)
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_active ON learning_resources (skill_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_resources_filters ON learning_resources (difficulty, is_free) WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS trg_learning_resources_updated_at ON learning_resources;
CREATE TRIGGER trg_learning_resources_updated_at
  BEFORE UPDATE ON learning_resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
