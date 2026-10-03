BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  otp_hash    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps (user_id);

COMMIT;
