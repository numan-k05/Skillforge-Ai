BEGIN;

-- Reproducible, versioned evidence scores. The evidence JSON contains the
-- source record identifiers used by the algorithm at measurement time.
CREATE TABLE IF NOT EXISTS evidence_readiness_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  algorithm_version VARCHAR(40) NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  band VARCHAR(24) NOT NULL CHECK (band IN ('Beginner','Developing','Job Ready','Strong Candidate')),
  components JSONB NOT NULL,
  evidence JSONB NOT NULL,
  evidence_fingerprint VARCHAR(64) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_readiness_user_time ON evidence_readiness_snapshots(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_readiness_fingerprint ON evidence_readiness_snapshots(user_id, algorithm_version, evidence_fingerprint);

-- Revocation is append-only: reviewed evidence remains auditable while it no
-- longer contributes readiness points. One active revocation per submission.
CREATE TABLE IF NOT EXISTS project_submission_revocations (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL UNIQUE REFERENCES project_submissions(id) ON DELETE CASCADE,
  revoked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 4000),
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_submission_revocations_time ON project_submission_revocations(revoked_at DESC);

COMMIT;
