BEGIN;

CREATE TABLE IF NOT EXISTS project_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects (id) ON DELETE RESTRICT,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected')),
  current_version_id BIGINT,
  reviewer_user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS project_submission_versions (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES project_submissions (id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 10000),
  summary TEXT NOT NULL,
  repository_url TEXT CHECK (repository_url IS NULL OR repository_url ~* '^https://'),
  demo_url TEXT CHECK (demo_url IS NULL OR demo_url ~* '^https://'),
  evidence_url TEXT CHECK (evidence_url IS NULL OR evidence_url ~* '^https://'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE (submission_id, version),
  UNIQUE (id, submission_id)
);

ALTER TABLE project_submissions DROP CONSTRAINT IF EXISTS project_submissions_current_version_fk;
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_current_version_fk
  FOREIGN KEY (current_version_id, id) REFERENCES project_submission_versions (id, submission_id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS project_submission_milestones (
  submission_version_id BIGINT NOT NULL REFERENCES project_submission_versions (id) ON DELETE CASCADE,
  project_milestone_id BIGINT NOT NULL REFERENCES project_milestones (id) ON DELETE RESTRICT,
  evidence_note TEXT,
  evidence_url TEXT CHECK (evidence_url IS NULL OR evidence_url ~* '^https://'),
  PRIMARY KEY (submission_version_id, project_milestone_id)
);

CREATE TABLE IF NOT EXISTS project_submission_reviews (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES project_submissions (id) ON DELETE CASCADE,
  submission_version_id BIGINT NOT NULL REFERENCES project_submission_versions (id) ON DELETE RESTRICT,
  reviewer_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved','rejected')),
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_version_id)
);

CREATE TABLE IF NOT EXISTS project_submission_status_history (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES project_submissions (id) ON DELETE CASCADE,
  submission_version_id BIGINT REFERENCES project_submission_versions (id) ON DELETE RESTRICT,
  from_status VARCHAR(24),
  to_status VARCHAR(24) NOT NULL CHECK (to_status IN ('draft','submitted','under_review','approved','rejected')),
  actor_user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_submissions_user ON project_submissions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_submissions_review_queue ON project_submissions (status, updated_at) WHERE status IN ('submitted','under_review');
CREATE INDEX IF NOT EXISTS idx_project_submission_versions_submission ON project_submission_versions (submission_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_project_submission_history ON project_submission_status_history (submission_id, created_at);

DROP TRIGGER IF EXISTS trg_project_submissions_updated_at ON project_submissions;
CREATE TRIGGER trg_project_submissions_updated_at BEFORE UPDATE ON project_submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
