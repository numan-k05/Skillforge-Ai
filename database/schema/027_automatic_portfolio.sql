BEGIN;

ALTER TABLE portfolio_profiles
  ADD COLUMN IF NOT EXISTS template_key VARCHAR(20) NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS publish_consent_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE portfolio_profiles ADD CONSTRAINT portfolio_template_key_chk
    CHECK (template_key IN ('classic','compact','showcase'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS portfolio_evidence_entries (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolio_profiles(id) ON DELETE CASCADE,
  submission_id BIGINT NOT NULL UNIQUE REFERENCES project_submissions(id) ON DELETE CASCADE,
  submission_version_id BIGINT NOT NULL REFERENCES project_submission_versions(id) ON DELETE RESTRICT,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  show_evidence_links BOOLEAN NOT NULL DEFAULT FALSE,
  display_order SMALLINT NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 1000),
  headline VARCHAR(200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_evidence_portfolio_order ON portfolio_evidence_entries(portfolio_id,display_order,id);
CREATE INDEX IF NOT EXISTS idx_portfolio_evidence_public ON portfolio_evidence_entries(portfolio_id,is_visible) WHERE is_visible=TRUE;
DROP TRIGGER IF EXISTS trg_portfolio_evidence_updated_at ON portfolio_evidence_entries;
CREATE TRIGGER trg_portfolio_evidence_updated_at BEFORE UPDATE ON portfolio_evidence_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill already-approved submissions. Entries remain private until their
-- owners explicitly select them and publish their portfolio.
INSERT INTO portfolio_profiles(user_id,slug)
SELECT DISTINCT ps.user_id,
  LEFT(COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(u.name),'[^a-z0-9]+','-','g')),''),'student'),78-char_length(ps.user_id::text))||'-'||ps.user_id
FROM project_submissions ps JOIN users u ON u.id=ps.user_id
WHERE ps.status='approved'
ON CONFLICT(user_id) DO NOTHING;

INSERT INTO portfolio_evidence_entries(portfolio_id,submission_id,submission_version_id,display_order)
SELECT pp.id,ps.id,ps.current_version_id,
  ROW_NUMBER() OVER(PARTITION BY pp.id ORDER BY ps.updated_at,ps.id)::smallint
FROM project_submissions ps JOIN portfolio_profiles pp ON pp.user_id=ps.user_id
WHERE ps.status='approved' AND ps.current_version_id IS NOT NULL
ON CONFLICT(submission_id) DO NOTHING;

COMMIT;
