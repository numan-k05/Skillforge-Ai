BEGIN;

CREATE TABLE IF NOT EXISTS quizzes (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(240) NOT NULL,
  course_id BIGINT REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id BIGINT REFERENCES course_lessons (id) ON DELETE CASCADE,
  skill_id BIGINT REFERENCES skills (id) ON DELETE RESTRICT,
  created_by BIGINT REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_one_target_chk CHECK (num_nonnulls(course_id, lesson_id, skill_id) = 1)
);

CREATE TABLE IF NOT EXISTS quiz_versions (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 10000),
  description TEXT,
  pass_percent SMALLINT NOT NULL DEFAULT 70 CHECK (pass_percent BETWEEN 1 AND 100),
  max_attempts SMALLINT NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 100),
  cooldown_minutes INTEGER NOT NULL DEFAULT 0 CHECK (cooldown_minutes BETWEEN 0 AND 525600),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_versions_published ON quiz_versions (quiz_id) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  quiz_version_id BIGINT NOT NULL REFERENCES quiz_versions (id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  explanation TEXT,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 1000),
  points SMALLINT NOT NULL DEFAULT 1 CHECK (points BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_version_id, position)
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 100),
  UNIQUE (question_id, position)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quiz_id BIGINT NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  quiz_version_id BIGINT NOT NULL REFERENCES quiz_versions (id) ON DELETE RESTRICT,
  attempt_number SMALLINT NOT NULL CHECK (attempt_number BETWEEN 1 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  question_order JSONB NOT NULL,
  option_orders JSONB NOT NULL,
  score_percent NUMERIC(5,2),
  earned_points INTEGER,
  total_points INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE (user_id, quiz_id, attempt_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempt_in_progress ON quiz_attempts (user_id, quiz_id) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  attempt_id BIGINT NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES quiz_questions (id) ON DELETE RESTRICT,
  selected_option_ids JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  earned_points SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_version ON quiz_questions (quiz_version_id, position);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options (question_id, position);

DROP TRIGGER IF EXISTS trg_quizzes_updated_at ON quizzes;
CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_quiz_versions_updated_at ON quiz_versions;
CREATE TRIGGER trg_quiz_versions_updated_at BEFORE UPDATE ON quiz_versions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER trg_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
