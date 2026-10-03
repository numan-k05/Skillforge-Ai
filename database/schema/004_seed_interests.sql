-- Optional seed data for the `interests` catalog.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- Run with: psql "$DATABASE_URL" -f database/schema/004_seed_interests.sql

INSERT INTO interests (name, category) VALUES
  ('Web Development', 'Software'),
  ('Mobile Development', 'Software'),
  ('Data Science', 'Data & AI'),
  ('Machine Learning', 'Data & AI'),
  ('Artificial Intelligence', 'Data & AI'),
  ('Cybersecurity', 'Security'),
  ('Cloud Computing', 'Infrastructure'),
  ('DevOps', 'Infrastructure'),
  ('Game Development', 'Software'),
  ('UI/UX Design', 'Design'),
  ('Product Management', 'Business'),
  ('Blockchain', 'Emerging Tech'),
  ('Embedded Systems', 'Hardware'),
  ('Competitive Programming', 'Computer Science'),
  ('Open Source', 'Community'),
  ('Freelancing', 'Career')
ON CONFLICT (name) DO NOTHING;
