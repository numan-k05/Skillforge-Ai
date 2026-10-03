BEGIN;

CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  skill_id BIGINT NOT NULL REFERENCES skills (id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours SMALLINT NOT NULL CHECK (estimated_hours BETWEEN 1 AND 1000),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_catalog ON courses (status, skill_id, difficulty);

CREATE TABLE IF NOT EXISTS course_prerequisites (
  course_id BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  prerequisite_course_id BIGINT NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
  PRIMARY KEY (course_id, prerequisite_course_id),
  CHECK (course_id <> prerequisite_course_id)
);

CREATE TABLE IF NOT EXISTS course_modules (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules (course_id, position);

CREATE TABLE IF NOT EXISTS course_lessons (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES course_modules (id) ON DELETE CASCADE,
  title VARCHAR(240) NOT NULL,
  summary TEXT,
  content TEXT,
  source_resource_id BIGINT REFERENCES learning_resources (id) ON DELETE SET NULL,
  source_url TEXT CHECK (source_url IS NULL OR source_url ~* '^https://'),
  provider VARCHAR(160),
  lesson_type VARCHAR(24) NOT NULL DEFAULT 'reading' CHECK (lesson_type IN ('reading', 'video', 'documentation', 'tutorial', 'practice', 'project')),
  estimated_minutes SMALLINT NOT NULL CHECK (estimated_minutes BETWEEN 1 AND 1440),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 1000),
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, position)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons (module_id, position) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES course_lessons (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress (lesson_id);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_course_modules_updated_at ON course_modules;
CREATE TRIGGER trg_course_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_course_lessons_updated_at ON course_lessons;
CREATE TRIGGER trg_course_lessons_updated_at BEFORE UPDATE ON course_lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_course_enrollments_updated_at ON course_enrollments;
CREATE TRIGGER trg_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
