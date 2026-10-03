-- =====================================================================
-- SkillForge AI — Phase 9A database schema (Portfolio foundation)
-- Stores only portfolio-specific visibility and selections. Existing
-- users, profiles, user_skills, projects, and user_projects remain the
-- authoritative source for account, career, skill, and project data.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS portfolio_profiles (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  slug              VARCHAR(80) NOT NULL,
  is_public         BOOLEAN NOT NULL DEFAULT FALSE,
  biography         TEXT,
  education         TEXT,
  show_career_goal  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_profiles_slug_format_chk
    CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])?$'),
  CONSTRAINT portfolio_profiles_biography_length_chk
    CHECK (biography IS NULL OR char_length(biography) <= 4000),
  CONSTRAINT portfolio_profiles_education_length_chk
    CHECK (education IS NULL OR char_length(education) <= 1000)
);

-- The expression index makes slugs case-insensitively unique even if a
-- value was inserted outside the API.
CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_profiles_slug_lower
  ON portfolio_profiles (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_portfolio_profiles_public_slug
  ON portfolio_profiles (slug) WHERE is_public = TRUE;

DROP TRIGGER IF EXISTS trg_portfolio_profiles_updated_at ON portfolio_profiles;
CREATE TRIGGER trg_portfolio_profiles_updated_at
  BEFORE UPDATE ON portfolio_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A project can be shown only when it is a completed user project; the
-- service validates that ownership/status rule before inserting here.
CREATE TABLE IF NOT EXISTS portfolio_projects (
  portfolio_id  BIGINT NOT NULL REFERENCES portfolio_profiles (id) ON DELETE CASCADE,
  project_id    BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  display_order SMALLINT NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (portfolio_id, project_id),
  CONSTRAINT uq_portfolio_projects_order UNIQUE (portfolio_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_project_id ON portfolio_projects (project_id);

-- A selected skill must belong to the owner in user_skills; this is
-- enforced by the authenticated service before creating these rows.
CREATE TABLE IF NOT EXISTS portfolio_skills (
  portfolio_id  BIGINT NOT NULL REFERENCES portfolio_profiles (id) ON DELETE CASCADE,
  skill_id      BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  display_order SMALLINT NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (portfolio_id, skill_id),
  CONSTRAINT uq_portfolio_skills_order UNIQUE (portfolio_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_skills_skill_id ON portfolio_skills (skill_id);

CREATE TABLE IF NOT EXISTS portfolio_links (
  id            BIGSERIAL PRIMARY KEY,
  portfolio_id  BIGINT NOT NULL REFERENCES portfolio_profiles (id) ON DELETE CASCADE,
  label         VARCHAR(80) NOT NULL,
  url           VARCHAR(2048) NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_links_label_length_chk CHECK (char_length(btrim(label)) >= 1),
  CONSTRAINT portfolio_links_url_format_chk CHECK (url ~* '^https?://[^\\s]+$'),
  CONSTRAINT uq_portfolio_links_order UNIQUE (portfolio_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_links_portfolio_id ON portfolio_links (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_achievements (
  id            BIGSERIAL PRIMARY KEY,
  portfolio_id  BIGINT NOT NULL REFERENCES portfolio_profiles (id) ON DELETE CASCADE,
  title         VARCHAR(160) NOT NULL,
  description   TEXT,
  achieved_on   DATE,
  display_order SMALLINT NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 30),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_achievements_title_length_chk CHECK (char_length(btrim(title)) >= 1),
  CONSTRAINT portfolio_achievements_description_length_chk
    CHECK (description IS NULL OR char_length(description) <= 1000),
  CONSTRAINT uq_portfolio_achievements_order UNIQUE (portfolio_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_achievements_portfolio_id
  ON portfolio_achievements (portfolio_id);

DROP TRIGGER IF EXISTS trg_portfolio_achievements_updated_at ON portfolio_achievements;
CREATE TRIGGER trg_portfolio_achievements_updated_at
  BEFORE UPDATE ON portfolio_achievements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
