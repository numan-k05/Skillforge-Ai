-- Seed data for Phase 4A: extends the `skills` catalog with the skills
-- referenced by career requirements below, then seeds
-- `career_skill_requirements` for the 13 initially-supported careers.
-- Safe to re-run: uses ON CONFLICT DO NOTHING throughout.
-- Run with: psql "$DATABASE_URL" -f database/schema/006_seed_career_skills.sql

-- ---------------------------------------------------------------------
-- Extra skills (in addition to the 8 seeded in 002_seed_skills.sql)
-- ---------------------------------------------------------------------
INSERT INTO skills (name, category, description) VALUES
  ('HTML/CSS', 'Frontend', 'Markup and styling fundamentals for the web.'),
  ('TypeScript', 'Programming Language', 'Typed superset of JavaScript.'),
  ('System Design', 'Computer Science', 'Designing scalable, maintainable software systems.'),
  ('Unit Testing', 'Quality', 'Writing automated tests for individual units of code.'),
  ('Mobile Development (React Native/Flutter)', 'Mobile', 'Cross-platform mobile app development.'),
  ('Mobile UI Design', 'Mobile', 'Designing usable, native-feeling mobile interfaces.'),
  ('Data Analysis (Pandas)', 'Data', 'Cleaning, transforming, and analyzing tabular data.'),
  ('Statistics', 'Data & AI', 'Statistical reasoning and inference for data work.'),
  ('Data Visualization', 'Data', 'Communicating data findings visually.'),
  ('Machine Learning', 'Data & AI', 'Building models that learn from data.'),
  ('ML Frameworks (TensorFlow/PyTorch)', 'Data & AI', 'Applied deep learning tooling.'),
  ('Linux/CLI', 'Infrastructure', 'Operating systems and command-line fundamentals.'),
  ('Docker', 'Infrastructure', 'Containerizing and packaging applications.'),
  ('CI/CD', 'Infrastructure', 'Automated build, test, and deployment pipelines.'),
  ('Cloud Computing (AWS/Azure/GCP)', 'Infrastructure', 'Deploying and running services on a cloud provider.'),
  ('Networking Fundamentals', 'Security', 'How data moves across networks and systems.'),
  ('Cybersecurity Fundamentals', 'Security', 'Core principles of protecting systems and data.'),
  ('Penetration Testing', 'Security', 'Ethically probing systems for security weaknesses.'),
  ('UI Design Tools (Figma)', 'Design', 'Interface design and prototyping tooling.'),
  ('UX Research', 'Design', 'Understanding user needs through research methods.'),
  ('Wireframing & Prototyping', 'Design', 'Sketching and prototyping product flows.'),
  ('Design Systems', 'Design', 'Building consistent, reusable design languages.')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- career_skill_requirements
-- required_level: 1 (Beginner) – 5 (Expert), matches user_skills scale.
-- importance: 1 (low) – 3 (high), used by the skill-gap priority calc.
-- ---------------------------------------------------------------------

-- Frontend Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Frontend Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('HTML/CSS', 4, 3),
  ('JavaScript', 4, 3),
  ('React', 4, 3),
  ('Git', 3, 2),
  ('REST API Design', 2, 2),
  ('TypeScript', 3, 2),
  ('Unit Testing', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Backend Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Backend Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Node.js', 4, 3),
  ('JavaScript', 3, 2),
  ('SQL', 4, 3),
  ('REST API Design', 4, 3),
  ('Git', 3, 2),
  ('Data Structures & Algorithms', 3, 2),
  ('System Design', 2, 2),
  ('Docker', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Full Stack Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Full Stack Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('JavaScript', 4, 3),
  ('React', 3, 3),
  ('Node.js', 3, 3),
  ('SQL', 3, 2),
  ('REST API Design', 3, 2),
  ('Git', 3, 2),
  ('HTML/CSS', 3, 2),
  ('System Design', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- React Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'React Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('React', 5, 3),
  ('JavaScript', 4, 3),
  ('HTML/CSS', 3, 2),
  ('TypeScript', 3, 2),
  ('Git', 3, 2),
  ('REST API Design', 2, 1),
  ('Unit Testing', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Python Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Python Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Python', 5, 3),
  ('SQL', 3, 2),
  ('Data Structures & Algorithms', 3, 2),
  ('Git', 3, 2),
  ('REST API Design', 2, 2),
  ('Unit Testing', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Mobile App Developer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Mobile App Developer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Mobile Development (React Native/Flutter)', 4, 3),
  ('JavaScript', 3, 2),
  ('Git', 3, 2),
  ('REST API Design', 3, 2),
  ('Mobile UI Design', 2, 2),
  ('Unit Testing', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Software Engineer (generalist)
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Software Engineer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Data Structures & Algorithms', 4, 3),
  ('Git', 3, 2),
  ('SQL', 3, 2),
  ('System Design', 3, 2),
  ('REST API Design', 3, 2),
  ('Unit Testing', 3, 2),
  ('JavaScript', 2, 1),
  ('Python', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Data Analyst
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Data Analyst', s.id, v.required_level, v.importance
FROM (VALUES
  ('SQL', 4, 3),
  ('Python', 3, 2),
  ('Data Analysis (Pandas)', 4, 3),
  ('Statistics', 3, 2),
  ('Data Visualization', 3, 2),
  ('Git', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Data Scientist
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Data Scientist', s.id, v.required_level, v.importance
FROM (VALUES
  ('Python', 4, 3),
  ('Statistics', 4, 3),
  ('Machine Learning', 4, 3),
  ('Data Analysis (Pandas)', 4, 3),
  ('SQL', 3, 2),
  ('Data Visualization', 3, 2),
  ('Git', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- AI / Machine Learning Engineer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'AI / Machine Learning Engineer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Python', 5, 3),
  ('Machine Learning', 5, 3),
  ('ML Frameworks (TensorFlow/PyTorch)', 4, 3),
  ('Statistics', 3, 2),
  ('Data Structures & Algorithms', 3, 2),
  ('SQL', 2, 1),
  ('Git', 3, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- DevOps Engineer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'DevOps Engineer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Linux/CLI', 4, 3),
  ('Docker', 4, 3),
  ('CI/CD', 4, 3),
  ('Cloud Computing (AWS/Azure/GCP)', 4, 3),
  ('Git', 4, 2),
  ('Networking Fundamentals', 3, 2),
  ('System Design', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- Cybersecurity Engineer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'Cybersecurity Engineer', s.id, v.required_level, v.importance
FROM (VALUES
  ('Networking Fundamentals', 4, 3),
  ('Cybersecurity Fundamentals', 4, 3),
  ('Linux/CLI', 3, 2),
  ('Penetration Testing', 3, 3),
  ('Python', 2, 1),
  ('Git', 2, 1)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;

-- UI/UX Designer
INSERT INTO career_skill_requirements (career_title, skill_id, required_level, importance)
SELECT 'UI/UX Designer', s.id, v.required_level, v.importance
FROM (VALUES
  ('UI Design Tools (Figma)', 4, 3),
  ('UX Research', 3, 3),
  ('Wireframing & Prototyping', 4, 3),
  ('HTML/CSS', 2, 1),
  ('Design Systems', 3, 2)
) AS v(skill_name, required_level, importance)
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_title, skill_id) DO NOTHING;
