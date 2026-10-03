BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  product_updates BOOLEAN NOT NULL DEFAULT FALSE,
  learning_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  public_profile_visible BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_type VARCHAR(40) NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing')),
  document_version VARCHAR(40) NOT NULL,
  granted BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_history_user ON consent_history(user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS account_deletion_records (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  retained_record_categories TEXT[] NOT NULL DEFAULT ARRAY['financial', 'certificate', 'referral', 'audit']::TEXT[]
);

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
