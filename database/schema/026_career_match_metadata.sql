BEGIN;

-- Optional editorial metadata for Career Match. Existing careers remain
-- usable: the service derives an experience label from requirement levels
-- when these fields are null.
ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS recommendation_summary TEXT;

DO $$ BEGIN
  ALTER TABLE careers ADD CONSTRAINT careers_experience_level_chk
    CHECK (experience_level IS NULL OR experience_level IN ('entry','intermediate','advanced'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_careers_match_catalog
  ON careers(is_active, category_id, title);

COMMIT;
