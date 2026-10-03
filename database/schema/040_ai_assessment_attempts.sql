BEGIN;

ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS question_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(24) NOT NULL DEFAULT 'reviewed',
  ADD COLUMN IF NOT EXISTS generation_provider VARCHAR(80),
  ADD COLUMN IF NOT EXISTS generation_model VARCHAR(160);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='quiz_attempt_generation_mode_chk') THEN
    ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempt_generation_mode_chk
      CHECK (generation_mode IN ('reviewed','ai','ai_fallback'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='quiz_attempt_question_snapshot_chk') THEN
    ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempt_question_snapshot_chk
      CHECK (question_snapshot IS NULL OR jsonb_typeof(question_snapshot)='array');
  END IF;
END $$;

COMMIT;
