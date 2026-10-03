-- Phase 5A — seed career_categories + skill_categories, then migrate the
-- 13 careers already seeded in Phase 4A (006_seed_career_skills.sql) from
-- the flat `career_skill_requirements` table into the new normalized
-- `careers` / `career_skills` tables. This is a COPY, not a MOVE:
-- `career_skill_requirements` is left exactly as it was.
--
-- Safe to re-run: every insert uses ON CONFLICT DO NOTHING.
-- Run with: psql "$DATABASE_URL" -f database/schema/008_migrate_existing_careers.sql

-- ---------------------------------------------------------------------
-- career_categories
-- ---------------------------------------------------------------------
INSERT INTO career_categories (name, slug, description, display_order) VALUES
  ('Technology', 'technology', 'Software, data, infrastructure, and security careers.', 1),
  ('Design & Creative', 'design-creative', 'Visual design, video, animation, and content creation careers.', 2),
  ('Digital Marketing', 'digital-marketing', 'Growth, content, and performance marketing careers.', 3),
  ('Business & Professional', 'business-professional', 'Analysis, management, sales, and operations careers.', 4),
  ('Knowledge & Education', 'knowledge-education', 'Research, teaching, and knowledge-work careers.', 5)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- skill_categories
-- ---------------------------------------------------------------------
INSERT INTO skill_categories (name, slug, description) VALUES
  ('Technical', 'technical', 'Programming, engineering, and hands-on technical skills.'),
  ('Design', 'design', 'Visual and interaction design skills.'),
  ('Creative', 'creative', 'Content, video, and creative production skills.'),
  ('Marketing', 'marketing', 'Growth, content, and channel marketing skills.'),
  ('Business', 'business', 'Analysis, strategy, and operations skills.'),
  ('Communication', 'communication', 'Writing, speaking, and interpersonal skills.'),
  ('Management', 'management', 'Planning, leadership, and coordination skills.'),
  ('Analytical', 'analytical', 'Data interpretation and quantitative reasoning skills.'),
  ('Research', 'research', 'Investigation, methodology, and synthesis skills.'),
  ('Productivity', 'productivity', 'Tools and habits for effective individual work.'),
  ('Professional', 'professional', 'General workplace and career-readiness skills.')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- Migrate the 13 Phase 4A careers into `careers`, all under Technology.
-- slug is derived from the title (lowercased, non-alphanumeric -> '-').
-- ---------------------------------------------------------------------
INSERT INTO careers (category_id, title, slug, short_description)
SELECT
  (SELECT id FROM career_categories WHERE slug = 'technology'),
  d.title,
  lower(regexp_replace(regexp_replace(d.title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
  d.short_description
FROM (VALUES
  ('Frontend Developer', 'Builds the user-facing part of web applications with HTML, CSS, and JavaScript frameworks.'),
  ('Backend Developer', 'Builds and maintains the server-side logic, APIs, and databases behind an application.'),
  ('Full Stack Developer', 'Works across both the frontend and backend of web applications.'),
  ('React Developer', 'Specializes in building interactive interfaces with the React library.'),
  ('Python Developer', 'Builds applications, scripts, and services primarily in Python.'),
  ('Mobile App Developer', 'Builds mobile applications for iOS and/or Android.'),
  ('Software Engineer', 'A generalist engineer who designs, builds, and maintains software systems.'),
  ('Data Analyst', 'Turns raw data into reports and insights that inform business decisions.'),
  ('Data Scientist', 'Builds statistical and machine-learning models to answer questions from data.'),
  ('AI / Machine Learning Engineer', 'Designs, trains, and deploys machine learning models in production.'),
  ('DevOps Engineer', 'Builds and maintains the infrastructure, CI/CD, and deployment pipelines for software teams.'),
  ('Cybersecurity Engineer', 'Protects systems and data from security threats.'),
  ('UI/UX Designer', 'Designs usable, effective interfaces and researches user needs.')
) AS d(title, short_description)
ON CONFLICT (title) DO NOTHING;

-- ---------------------------------------------------------------------
-- Copy the Phase 4A alias map (backend/src/utils/careerMatcher.js) into
-- career_aliases, so career-goal matching becomes DB-driven.
-- ---------------------------------------------------------------------
INSERT INTO career_aliases (career_id, alias)
SELECT c.id, v.alias
FROM (VALUES
  ('front end developer', 'Frontend Developer'),
  ('frontend engineer', 'Frontend Developer'),
  ('front end engineer', 'Frontend Developer'),
  ('back end developer', 'Backend Developer'),
  ('backend engineer', 'Backend Developer'),
  ('back end engineer', 'Backend Developer'),
  ('fullstack developer', 'Full Stack Developer'),
  ('full-stack developer', 'Full Stack Developer'),
  ('fullstack engineer', 'Full Stack Developer'),
  ('full stack engineer', 'Full Stack Developer'),
  ('reactjs developer', 'React Developer'),
  ('react.js developer', 'React Developer'),
  ('react js developer', 'React Developer'),
  ('mobile developer', 'Mobile App Developer'),
  ('app developer', 'Mobile App Developer'),
  ('android developer', 'Mobile App Developer'),
  ('ios developer', 'Mobile App Developer'),
  ('swe', 'Software Engineer'),
  ('generalist software engineer', 'Software Engineer'),
  ('ml engineer', 'AI / Machine Learning Engineer'),
  ('machine learning engineer', 'AI / Machine Learning Engineer'),
  ('ai engineer', 'AI / Machine Learning Engineer'),
  ('artificial intelligence engineer', 'AI / Machine Learning Engineer'),
  ('devops', 'DevOps Engineer'),
  ('site reliability engineer', 'DevOps Engineer'),
  ('sre', 'DevOps Engineer'),
  ('cybersecurity analyst', 'Cybersecurity Engineer'),
  ('security engineer', 'Cybersecurity Engineer'),
  ('information security engineer', 'Cybersecurity Engineer'),
  ('ux designer', 'UI/UX Designer'),
  ('ui designer', 'UI/UX Designer'),
  ('ux/ui designer', 'UI/UX Designer'),
  ('product designer', 'UI/UX Designer')
) AS v(alias, title)
JOIN careers c ON c.title = v.title
ON CONFLICT (alias) DO NOTHING;

-- Also register each career's own (normalized) title as its alias, so
-- an exact-title career goal always resolves via the same alias lookup
-- path used for every other career (no special-casing in application code).
INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

-- ---------------------------------------------------------------------
-- Backfill skill_category_id / skill_type / difficulty on the skills
-- already seeded in Phase 2/4A, based on their existing free-text
-- `category`. Anything not matched below keeps the column defaults
-- (skill_type = 'hard_skill', skill_category_id = NULL) rather than
-- guessing.
-- ---------------------------------------------------------------------
UPDATE skills SET skill_category_id = (SELECT id FROM skill_categories WHERE slug = 'technical')
WHERE skill_category_id IS NULL
  AND category IN ('Frontend', 'Backend', 'Programming Language', 'Computer Science', 'Database',
                    'Version Control', 'Mobile', 'Data', 'Infrastructure', 'Quality');

UPDATE skills SET skill_category_id = (SELECT id FROM skill_categories WHERE slug = 'analytical')
WHERE skill_category_id IS NULL AND category IN ('Data & AI');

UPDATE skills SET skill_category_id = (SELECT id FROM skill_categories WHERE slug = 'technical')
WHERE skill_category_id IS NULL AND category = 'Security';

UPDATE skills SET skill_category_id = (SELECT id FROM skill_categories WHERE slug = 'design')
WHERE skill_category_id IS NULL AND category = 'Design';

UPDATE skills SET skill_type = 'tool'
WHERE name IN ('Git', 'GitHub', 'Docker', 'Linux/CLI', 'UI Design Tools (Figma)',
                'ML Frameworks (TensorFlow/PyTorch)', 'Cloud Computing (AWS/Azure/GCP)');

UPDATE skills SET difficulty = 2 WHERE difficulty IS NULL AND name IN ('HTML', 'CSS', 'HTML/CSS', 'Git', 'GitHub');
UPDATE skills SET difficulty = 3 WHERE difficulty IS NULL AND name IN (
  'JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'REST API Design', 'TypeScript',
  'Unit Testing', 'UI Design Tools (Figma)', 'UX Research', 'Wireframing & Prototyping',
  'Design Systems', 'Data Analysis (Pandas)', 'Data Visualization', 'Linux/CLI', 'Docker', 'CI/CD'
);
UPDATE skills SET difficulty = 4 WHERE difficulty IS NULL AND name IN (
  'Data Structures & Algorithms', 'System Design', 'Statistics', 'Machine Learning',
  'Cloud Computing (AWS/Azure/GCP)', 'Networking Fundamentals', 'Cybersecurity Fundamentals',
  'Mobile Development (React Native/Flutter)', 'Mobile UI Design'
);
UPDATE skills SET difficulty = 5 WHERE difficulty IS NULL AND name IN (
  'ML Frameworks (TensorFlow/PyTorch)', 'Penetration Testing'
);
UPDATE skills SET difficulty = 2 WHERE difficulty IS NULL;

-- ---------------------------------------------------------------------
-- Copy career_skill_requirements (Phase 4A) into career_skills.
-- required_level -> target_level; min_level is set one step below
-- target (floor of 1) since Phase 4A never tracked a separate minimum;
-- priority mirrors importance (Phase 4A had no separate priority axis).
-- ---------------------------------------------------------------------
INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT
  c.id,
  csr.skill_id,
  CASE WHEN csr.importance = 1 THEN 'recommended' ELSE 'required' END,
  GREATEST(csr.required_level - 1, 1),
  csr.required_level,
  csr.importance,
  csr.importance
FROM career_skill_requirements csr
JOIN careers c ON c.title = csr.career_title
ON CONFLICT (career_id, skill_id) DO NOTHING;
