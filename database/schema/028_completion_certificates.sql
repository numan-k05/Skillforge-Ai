BEGIN;

CREATE TABLE IF NOT EXISTS certificate_definitions (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  required_readiness_score SMALLINT NOT NULL DEFAULT 0 CHECK (required_readiness_score BETWEEN 0 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificate_required_lessons (
  definition_id BIGINT NOT NULL REFERENCES certificate_definitions(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES course_lessons(id) ON DELETE RESTRICT,
  PRIMARY KEY (definition_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS certificate_required_quizzes (
  definition_id BIGINT NOT NULL REFERENCES certificate_definitions(id) ON DELETE CASCADE,
  quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
  PRIMARY KEY (definition_id, quiz_id)
);
CREATE TABLE IF NOT EXISTS certificate_required_projects (
  definition_id BIGINT NOT NULL REFERENCES certificate_definitions(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  PRIMARY KEY (definition_id, project_id)
);

CREATE TABLE IF NOT EXISTS issued_certificates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  definition_id BIGINT NOT NULL REFERENCES certificate_definitions(id) ON DELETE RESTRICT,
  verification_code VARCHAR(32) NOT NULL UNIQUE CHECK (verification_code ~ '^[A-Za-z0-9_-]{32}$'),
  recipient_name_snapshot VARCHAR(120) NOT NULL,
  certificate_title_snapshot VARCHAR(200) NOT NULL,
  requirements_snapshot JSONB NOT NULL,
  readiness_snapshot_id BIGINT REFERENCES evidence_readiness_snapshots(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  revoked_at TIMESTAMPTZ,
  revoked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  revocation_reason TEXT,
  UNIQUE (user_id, definition_id),
  CHECK ((status='active' AND revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
      OR (status='revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_user ON issued_certificates(user_id,issued_at DESC);

CREATE TABLE IF NOT EXISTS certificate_status_history (
  id BIGSERIAL PRIMARY KEY,
  certificate_id BIGINT NOT NULL REFERENCES issued_certificates(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('issued','revoked')),
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificate_history_certificate ON certificate_status_history(certificate_id,occurred_at,id);

CREATE OR REPLACE FUNCTION protect_certificate_issue_snapshot() RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.definition_id IS DISTINCT FROM OLD.definition_id
    OR NEW.verification_code IS DISTINCT FROM OLD.verification_code
    OR NEW.recipient_name_snapshot IS DISTINCT FROM OLD.recipient_name_snapshot
    OR NEW.certificate_title_snapshot IS DISTINCT FROM OLD.certificate_title_snapshot
    OR NEW.requirements_snapshot IS DISTINCT FROM OLD.requirements_snapshot
    OR NEW.readiness_snapshot_id IS DISTINCT FROM OLD.readiness_snapshot_id
    OR NEW.issued_at IS DISTINCT FROM OLD.issued_at THEN
    RAISE EXCEPTION 'Issued certificate snapshots are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certificate_snapshot_immutable ON issued_certificates;
CREATE TRIGGER trg_certificate_snapshot_immutable BEFORE UPDATE ON issued_certificates
  FOR EACH ROW EXECUTE FUNCTION protect_certificate_issue_snapshot();
DROP TRIGGER IF EXISTS trg_certificate_definition_updated_at ON certificate_definitions;
CREATE TRIGGER trg_certificate_definition_updated_at BEFORE UPDATE ON certificate_definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
