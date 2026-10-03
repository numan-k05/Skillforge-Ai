-- Optional seed data for the `skills` catalog.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- Run with: psql "$DATABASE_URL" -f database/schema/002_seed_skills.sql

INSERT INTO skills (name, category, description) VALUES
  ('JavaScript', 'Programming Language', 'Core language for web development.'),
  ('Python', 'Programming Language', 'General-purpose language used across data, backend, and scripting.'),
  ('SQL', 'Data', 'Querying and managing relational databases.'),
  ('React', 'Frontend', 'Component-based UI library.'),
  ('Node.js', 'Backend', 'JavaScript runtime for building backend services.'),
  ('Git', 'Tooling', 'Version control fundamentals.'),
  ('Data Structures & Algorithms', 'Computer Science', 'Core problem-solving foundation.'),
  ('REST API Design', 'Backend', 'Designing and consuming HTTP APIs.')
ON CONFLICT (name) DO NOTHING;
