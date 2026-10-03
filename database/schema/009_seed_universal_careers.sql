-- Phase 5A — seed the universal career catalog.
-- Adds: a handful of additional Technology careers named in the Phase 5A
-- brief that Phase 4A didn't cover yet, plus four entirely new career
-- groups (Design & Creative, Digital Marketing, Business & Professional,
-- Knowledge & Education), each with a realistic, non-placeholder set of
-- required/recommended skills.
--
-- Safe to re-run: every insert uses ON CONFLICT DO NOTHING.
-- Run with: psql "$DATABASE_URL" -f database/schema/009_seed_universal_careers.sql

-- =======================================================================
-- 1. New skills (grouped by the discipline that introduces them)
-- =======================================================================

-- ---- Technology (fills out Android/iOS/QA/Database/Game careers) -----
INSERT INTO skills (name, category, description, skill_category_id, skill_type, difficulty) VALUES
  ('Kotlin', 'Programming Language', 'Modern language for native Android development.',
    (SELECT id FROM skill_categories WHERE slug = 'technical'), 'hard_skill', 3),
  ('Swift', 'Programming Language', 'Apple''s language for native iOS/macOS development.',
    (SELECT id FROM skill_categories WHERE slug = 'technical'), 'hard_skill', 3),
  ('Database Design', 'Database', 'Modeling and normalizing relational data for performance and integrity.',
    (SELECT id FROM skill_categories WHERE slug = 'technical'), 'hard_skill', 3),
  ('Test Automation', 'Quality', 'Writing automated tests and test frameworks for application quality.',
    (SELECT id FROM skill_categories WHERE slug = 'technical'), 'hard_skill', 3),
  ('Game Development (Unity/Unreal)', 'Game Development', 'Building interactive games with a game engine.',
    (SELECT id FROM skill_categories WHERE slug = 'technical'), 'tool', 4)
ON CONFLICT (name) DO NOTHING;

-- ---- Design & Creative --------------------------------------------------
INSERT INTO skills (name, category, description, skill_category_id, skill_type, difficulty) VALUES
  ('Typography', 'Design', 'Choosing and arranging type for readability and tone.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'hard_skill', 2),
  ('Color Theory', 'Design', 'Using color relationships to guide attention and mood.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'hard_skill', 2),
  ('Layout Design', 'Design', 'Composing visual elements into a clear, balanced whole.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'hard_skill', 2),
  ('Branding', 'Design', 'Building a consistent visual identity for a person or company.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'hard_skill', 3),
  ('Adobe Photoshop', 'Design', 'Raster image editing and compositing.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'tool', 3),
  ('Adobe Illustrator', 'Design', 'Vector illustration and logo/icon design.',
    (SELECT id FROM skill_categories WHERE slug = 'design'), 'tool', 3),
  ('Video Editing', 'Creative', 'Assembling and cutting raw footage into a finished video.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 3),
  ('Adobe Premiere Pro', 'Creative', 'Non-linear video editing software.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'tool', 3),
  ('Motion Graphics', 'Creative', 'Animating graphic elements for video and screen.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 4),
  ('Adobe After Effects', 'Creative', 'Motion graphics and visual-effects compositing software.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'tool', 4),
  ('3D Modeling', 'Creative', 'Building three-dimensional assets and scenes.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 4),
  ('Animation Principles', 'Creative', 'Timing, weight, and motion fundamentals behind believable animation.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 3),
  ('Photography', 'Creative', 'Composing and capturing still images, including lighting and camera technique.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 3),
  ('Storyboarding', 'Creative', 'Planning a video or animation shot-by-shot before production.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 2),
  ('Content Creation', 'Creative', 'Planning and producing content for an audience across formats.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 2),
  ('Illustration', 'Creative', 'Drawing original artwork, digitally or traditionally.',
    (SELECT id FROM skill_categories WHERE slug = 'creative'), 'hard_skill', 3)
ON CONFLICT (name) DO NOTHING;

-- ---- Digital Marketing ---------------------------------------------------
INSERT INTO skills (name, category, description, skill_category_id, skill_type, difficulty) VALUES
  ('SEO', 'Marketing', 'Improving a site''s visibility in organic search results.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 3),
  ('Social Media Marketing', 'Marketing', 'Growing and engaging an audience across social platforms.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 2),
  ('Content Marketing', 'Marketing', 'Planning content that attracts and retains a defined audience.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 2),
  ('Copywriting', 'Marketing', 'Writing persuasive copy for ads, pages, and campaigns.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 2),
  ('Email Marketing', 'Marketing', 'Planning and automating email campaigns and lifecycle messaging.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 2),
  ('Marketing Analytics', 'Marketing', 'Measuring and interpreting marketing performance data.',
    (SELECT id FROM skill_categories WHERE slug = 'analytical'), 'hard_skill', 3),
  ('Google Analytics', 'Marketing', 'Web analytics platform for tracking site and campaign performance.',
    (SELECT id FROM skill_categories WHERE slug = 'analytical'), 'tool', 3),
  ('Paid Advertising (PPC)', 'Marketing', 'Running and optimizing paid search and social ad campaigns.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 3),
  ('E-commerce Platforms', 'Marketing', 'Managing online storefronts (e.g. Shopify) and product catalogs.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'tool', 2),
  ('Marketing Strategy', 'Marketing', 'Planning campaigns and channels around business goals.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 3),
  ('Conversion Rate Optimization', 'Marketing', 'Testing and improving how many visitors take a desired action.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 4),
  ('Brand Strategy', 'Marketing', 'Defining positioning, voice, and identity for a brand.',
    (SELECT id FROM skill_categories WHERE slug = 'marketing'), 'hard_skill', 3)
ON CONFLICT (name) DO NOTHING;

-- ---- Business & Professional ---------------------------------------------
INSERT INTO skills (name, category, description, skill_category_id, skill_type, difficulty) VALUES
  ('Business Analysis', 'Business', 'Identifying business needs and recommending solutions.',
    (SELECT id FROM skill_categories WHERE slug = 'business'), 'hard_skill', 3),
  ('Requirements Gathering', 'Business', 'Eliciting and documenting what stakeholders actually need.',
    (SELECT id FROM skill_categories WHERE slug = 'business'), 'hard_skill', 3),
  ('Data Analysis', 'Business', 'Examining data to answer a business question, tool-agnostic.',
    (SELECT id FROM skill_categories WHERE slug = 'analytical'), 'hard_skill', 3),
  ('Communication', 'Professional', 'Conveying information clearly, in writing and in person.',
    (SELECT id FROM skill_categories WHERE slug = 'communication'), 'soft_skill', 2),
  ('Documentation', 'Business', 'Writing clear, structured records of decisions, processes, and requirements.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'hard_skill', 2),
  ('Problem Solving', 'Professional', 'Structuring and working through ambiguous problems.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'soft_skill', 2),
  ('Project Management', 'Management', 'Planning, tracking, and delivering work against scope and timeline.',
    (SELECT id FROM skill_categories WHERE slug = 'management'), 'hard_skill', 3),
  ('Agile/Scrum', 'Management', 'Running iterative delivery using Agile/Scrum ceremonies and artifacts.',
    (SELECT id FROM skill_categories WHERE slug = 'management'), 'hard_skill', 2),
  ('Stakeholder Management', 'Management', 'Aligning people with different interests toward a shared outcome.',
    (SELECT id FROM skill_categories WHERE slug = 'management'), 'soft_skill', 3),
  ('Technical Writing', 'Business', 'Explaining technical concepts clearly to a given audience.',
    (SELECT id FROM skill_categories WHERE slug = 'communication'), 'hard_skill', 2),
  ('Sales Negotiation', 'Business', 'Reaching agreements that work for both the buyer and the business.',
    (SELECT id FROM skill_categories WHERE slug = 'business'), 'soft_skill', 3),
  ('Recruitment & Talent Acquisition', 'Business', 'Sourcing, screening, and hiring candidates.',
    (SELECT id FROM skill_categories WHERE slug = 'business'), 'hard_skill', 2),
  ('Operations Management', 'Business', 'Keeping day-to-day business processes running efficiently.',
    (SELECT id FROM skill_categories WHERE slug = 'management'), 'hard_skill', 3),
  ('Business Development', 'Business', 'Identifying and pursuing new growth opportunities and partnerships.',
    (SELECT id FROM skill_categories WHERE slug = 'business'), 'hard_skill', 3),
  ('Financial Modeling', 'Business', 'Building spreadsheet models to forecast and evaluate business decisions.',
    (SELECT id FROM skill_categories WHERE slug = 'analytical'), 'hard_skill', 4),
  ('Process Improvement', 'Business', 'Finding and removing inefficiencies in an existing workflow.',
    (SELECT id FROM skill_categories WHERE slug = 'management'), 'hard_skill', 3)
ON CONFLICT (name) DO NOTHING;

-- ---- Knowledge & Education -------------------------------------------------
INSERT INTO skills (name, category, description, skill_category_id, skill_type, difficulty) VALUES
  ('Research Methods', 'Research', 'Designing and running a rigorous investigation into a question.',
    (SELECT id FROM skill_categories WHERE slug = 'research'), 'hard_skill', 3),
  ('Academic Writing', 'Research', 'Writing clearly and rigorously for an academic or expert audience.',
    (SELECT id FROM skill_categories WHERE slug = 'research'), 'hard_skill', 3),
  ('Curriculum Design', 'Education', 'Structuring learning content into an effective sequence.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'hard_skill', 3),
  ('Public Speaking', 'Education', 'Presenting ideas clearly and confidently to an audience.',
    (SELECT id FROM skill_categories WHERE slug = 'communication'), 'soft_skill', 2),
  ('Instructional Design', 'Education', 'Designing learning experiences and materials around learning outcomes.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'hard_skill', 3),
  ('Financial Analysis', 'Business', 'Interpreting financial statements and metrics to inform decisions.',
    (SELECT id FROM skill_categories WHERE slug = 'analytical'), 'hard_skill', 4),
  ('Critical Thinking', 'Professional', 'Evaluating evidence and arguments before drawing a conclusion.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'soft_skill', 2),
  ('Subject Matter Expertise', 'Education', 'Deep, credible knowledge in a specific field or topic.',
    (SELECT id FROM skill_categories WHERE slug = 'professional'), 'hard_skill', 3)
ON CONFLICT (name) DO NOTHING;

-- =======================================================================
-- 2. Remaining Technology careers (Phase 4A covered 13; these fill out
--    the rest of the Phase 5A Technology list).
-- =======================================================================
INSERT INTO careers (category_id, title, slug, short_description)
SELECT (SELECT id FROM career_categories WHERE slug = 'technology'), d.title, d.slug, d.short_description
FROM (VALUES
  ('Android Developer', 'android-developer', 'Builds native Android applications, primarily with Kotlin.'),
  ('iOS Developer', 'ios-developer', 'Builds native iOS applications, primarily with Swift.'),
  ('Cloud Engineer', 'cloud-engineer', 'Designs and operates cloud infrastructure and services.'),
  ('QA Engineer', 'qa-engineer', 'Designs and runs manual and automated tests to catch defects before release.'),
  ('Database Engineer', 'database-engineer', 'Designs, tunes, and maintains database systems.'),
  ('Game Developer', 'game-developer', 'Builds interactive games using a game engine and gameplay code.')
) AS d(title, slug, short_description)
ON CONFLICT (title) DO NOTHING;

-- Fix the Phase 4A "UI/UX Designer" career's category: it was carried
-- over from career_skill_requirements under Technology by the previous
-- migration, but Phase 5A's taxonomy groups it under Design & Creative.
-- Its existing skill requirements (copied from Phase 4A) are untouched.
UPDATE careers
SET category_id = (SELECT id FROM career_categories WHERE slug = 'design-creative')
WHERE title = 'UI/UX Designer';

INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

-- career_skills for the new Technology careers
INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT c.id, s.id, v.skill_type, v.min_level, v.target_level, v.importance, v.priority
FROM (VALUES
  ('Android Developer', 'Kotlin', 'required', 2, 4, 3, 3),
  ('Android Developer', 'Mobile UI Design', 'required', 1, 3, 2, 2),
  ('Android Developer', 'Git', 'required', 1, 3, 2, 2),
  ('Android Developer', 'REST API Design', 'required', 1, 3, 2, 1),
  ('Android Developer', 'Unit Testing', 'recommended', 1, 2, 1, 1),
  ('iOS Developer', 'Swift', 'required', 2, 4, 3, 3),
  ('iOS Developer', 'Mobile UI Design', 'required', 1, 3, 2, 2),
  ('iOS Developer', 'Git', 'required', 1, 3, 2, 2),
  ('iOS Developer', 'REST API Design', 'required', 1, 3, 2, 1),
  ('iOS Developer', 'Unit Testing', 'recommended', 1, 2, 1, 1),
  ('Cloud Engineer', 'Cloud Computing (AWS/Azure/GCP)', 'required', 2, 4, 3, 3),
  ('Cloud Engineer', 'Linux/CLI', 'required', 2, 4, 3, 2),
  ('Cloud Engineer', 'Docker', 'required', 1, 3, 2, 2),
  ('Cloud Engineer', 'CI/CD', 'required', 1, 3, 2, 2),
  ('Cloud Engineer', 'Networking Fundamentals', 'required', 1, 3, 2, 1),
  ('Cloud Engineer', 'System Design', 'recommended', 1, 2, 1, 1),
  ('QA Engineer', 'Test Automation', 'required', 2, 4, 3, 3),
  ('QA Engineer', 'Unit Testing', 'required', 1, 3, 2, 2),
  ('QA Engineer', 'SQL', 'required', 1, 2, 1, 1),
  ('QA Engineer', 'Git', 'required', 1, 3, 2, 1),
  ('QA Engineer', 'Problem Solving', 'recommended', 1, 3, 2, 2),
  ('Database Engineer', 'SQL', 'required', 3, 5, 3, 3),
  ('Database Engineer', 'Database Design', 'required', 2, 4, 3, 3),
  ('Database Engineer', 'System Design', 'required', 1, 3, 2, 2),
  ('Database Engineer', 'Linux/CLI', 'recommended', 1, 2, 1, 1),
  ('Game Developer', 'Game Development (Unity/Unreal)', 'required', 2, 4, 3, 3),
  ('Game Developer', 'Data Structures & Algorithms', 'required', 2, 3, 2, 2),
  ('Game Developer', '3D Modeling', 'recommended', 1, 2, 1, 1),
  ('Game Developer', 'Git', 'required', 1, 3, 2, 1)
) AS v(career_title, skill_name, skill_type, min_level, target_level, importance, priority)
JOIN careers c ON c.title = v.career_title
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_id, skill_id) DO NOTHING;

-- =======================================================================
-- 3. Design & Creative careers (UI/UX Designer already exists — see above)
-- =======================================================================
INSERT INTO careers (category_id, title, slug, short_description)
SELECT (SELECT id FROM career_categories WHERE slug = 'design-creative'), d.title, d.slug, d.short_description
FROM (VALUES
  ('Graphic Designer', 'graphic-designer', 'Creates visual concepts for print and digital media using typography and imagery.'),
  ('Video Editor', 'video-editor', 'Assembles raw footage into polished, story-driven videos.'),
  ('Motion Graphics Designer', 'motion-graphics-designer', 'Animates graphics and type for video, ads, and product UI.'),
  ('3D Artist', '3d-artist', 'Models, textures, and renders 3D assets for games, film, or product visualization.'),
  ('Animator', 'animator', 'Brings characters and objects to life through motion.'),
  ('Content Creator', 'content-creator', 'Plans, produces, and publishes content for an online audience.'),
  ('Photographer', 'photographer', 'Captures and edits still images for clients, brands, or personal projects.'),
  ('Brand Designer', 'brand-designer', 'Builds cohesive visual identities and brand systems.')
) AS d(title, slug, short_description)
ON CONFLICT (title) DO NOTHING;

INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT c.id, s.id, v.skill_type, v.min_level, v.target_level, v.importance, v.priority
FROM (VALUES
  ('Graphic Designer', 'Typography', 'required', 2, 4, 3, 3),
  ('Graphic Designer', 'Color Theory', 'required', 2, 4, 3, 3),
  ('Graphic Designer', 'Layout Design', 'required', 2, 4, 3, 2),
  ('Graphic Designer', 'Adobe Photoshop', 'required', 2, 4, 2, 2),
  ('Graphic Designer', 'Adobe Illustrator', 'required', 2, 4, 2, 2),
  ('Graphic Designer', 'Branding', 'recommended', 1, 3, 2, 1),
  ('Video Editor', 'Video Editing', 'required', 2, 4, 3, 3),
  ('Video Editor', 'Adobe Premiere Pro', 'required', 2, 4, 3, 3),
  ('Video Editor', 'Storyboarding', 'required', 1, 3, 2, 2),
  ('Video Editor', 'Color Theory', 'recommended', 1, 2, 1, 1),
  ('Video Editor', 'Content Creation', 'recommended', 1, 3, 2, 1),
  ('Motion Graphics Designer', 'Motion Graphics', 'required', 2, 4, 3, 3),
  ('Motion Graphics Designer', 'Adobe After Effects', 'required', 2, 4, 3, 3),
  ('Motion Graphics Designer', 'Animation Principles', 'required', 1, 3, 2, 2),
  ('Motion Graphics Designer', 'Typography', 'recommended', 1, 3, 2, 1),
  ('3D Artist', '3D Modeling', 'required', 2, 4, 3, 3),
  ('3D Artist', 'Animation Principles', 'recommended', 1, 3, 2, 2),
  ('3D Artist', 'Layout Design', 'recommended', 1, 2, 1, 1),
  ('Animator', 'Animation Principles', 'required', 2, 4, 3, 3),
  ('Animator', 'Storyboarding', 'required', 1, 3, 2, 2),
  ('Animator', 'Adobe After Effects', 'recommended', 1, 3, 2, 2),
  ('Animator', '3D Modeling', 'optional', 1, 2, 1, 1),
  ('Content Creator', 'Content Creation', 'required', 2, 4, 3, 3),
  ('Content Creator', 'Video Editing', 'required', 1, 3, 2, 2),
  ('Content Creator', 'Social Media Marketing', 'required', 1, 3, 2, 2),
  ('Content Creator', 'Photography', 'recommended', 1, 2, 1, 1),
  ('Content Creator', 'Copywriting', 'recommended', 1, 3, 2, 1),
  ('Photographer', 'Photography', 'required', 2, 4, 3, 3),
  ('Photographer', 'Adobe Photoshop', 'required', 2, 4, 2, 2),
  ('Photographer', 'Color Theory', 'recommended', 1, 3, 2, 1),
  ('Brand Designer', 'Branding', 'required', 2, 4, 3, 3),
  ('Brand Designer', 'Typography', 'required', 2, 4, 2, 2),
  ('Brand Designer', 'Color Theory', 'required', 2, 4, 2, 2),
  ('Brand Designer', 'Adobe Illustrator', 'required', 2, 4, 2, 2),
  ('Brand Designer', 'Brand Strategy', 'recommended', 1, 3, 2, 1)
) AS v(career_title, skill_name, skill_type, min_level, target_level, importance, priority)
JOIN careers c ON c.title = v.career_title
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_id, skill_id) DO NOTHING;

-- =======================================================================
-- 4. Digital Marketing careers
-- =======================================================================
INSERT INTO careers (category_id, title, slug, short_description)
SELECT (SELECT id FROM career_categories WHERE slug = 'digital-marketing'), d.title, d.slug, d.short_description
FROM (VALUES
  ('Digital Marketer', 'digital-marketer', 'Plans and runs marketing campaigns across digital channels.'),
  ('SEO Specialist', 'seo-specialist', 'Improves organic search visibility and rankings.'),
  ('Social Media Manager', 'social-media-manager', 'Owns a brand''s presence and engagement across social platforms.'),
  ('Content Strategist', 'content-strategist', 'Plans what content to create and why, to meet audience and business goals.'),
  ('Copywriter', 'copywriter', 'Writes persuasive copy for ads, websites, and campaigns.'),
  ('E-commerce Specialist', 'ecommerce-specialist', 'Manages online storefronts, product listings, and sales funnels.'),
  ('Email Marketing Specialist', 'email-marketing-specialist', 'Plans and automates email campaigns and lifecycle messaging.'),
  ('Performance Marketing Specialist', 'performance-marketing-specialist', 'Runs and optimizes paid acquisition campaigns against measurable targets.')
) AS d(title, slug, short_description)
ON CONFLICT (title) DO NOTHING;

INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT c.id, s.id, v.skill_type, v.min_level, v.target_level, v.importance, v.priority
FROM (VALUES
  ('Digital Marketer', 'SEO', 'required', 1, 3, 2, 2),
  ('Digital Marketer', 'Social Media Marketing', 'required', 2, 4, 3, 3),
  ('Digital Marketer', 'Content Marketing', 'required', 2, 4, 3, 3),
  ('Digital Marketer', 'Marketing Analytics', 'required', 1, 3, 2, 2),
  ('Digital Marketer', 'Copywriting', 'required', 1, 3, 2, 2),
  ('Digital Marketer', 'Email Marketing', 'recommended', 1, 3, 2, 1),
  ('SEO Specialist', 'SEO', 'required', 3, 5, 3, 3),
  ('SEO Specialist', 'Google Analytics', 'required', 2, 4, 3, 3),
  ('SEO Specialist', 'Content Marketing', 'required', 1, 3, 2, 2),
  ('SEO Specialist', 'Marketing Analytics', 'recommended', 1, 3, 2, 1),
  ('Social Media Manager', 'Social Media Marketing', 'required', 3, 5, 3, 3),
  ('Social Media Manager', 'Content Creation', 'required', 2, 4, 3, 3),
  ('Social Media Manager', 'Copywriting', 'required', 1, 3, 2, 2),
  ('Social Media Manager', 'Marketing Analytics', 'recommended', 1, 2, 1, 1),
  ('Content Strategist', 'Content Marketing', 'required', 3, 5, 3, 3),
  ('Content Strategist', 'Marketing Strategy', 'required', 2, 4, 3, 3),
  ('Content Strategist', 'Copywriting', 'required', 1, 3, 2, 2),
  ('Content Strategist', 'Marketing Analytics', 'recommended', 1, 3, 2, 1),
  ('Copywriter', 'Copywriting', 'required', 3, 5, 3, 3),
  ('Copywriter', 'Content Marketing', 'required', 1, 3, 2, 2),
  ('Copywriter', 'Brand Strategy', 'recommended', 1, 2, 1, 1),
  ('E-commerce Specialist', 'E-commerce Platforms', 'required', 2, 4, 3, 3),
  ('E-commerce Specialist', 'Conversion Rate Optimization', 'required', 1, 3, 2, 2),
  ('E-commerce Specialist', 'Marketing Analytics', 'required', 1, 3, 2, 2),
  ('E-commerce Specialist', 'Paid Advertising (PPC)', 'recommended', 1, 3, 2, 1),
  ('Email Marketing Specialist', 'Email Marketing', 'required', 3, 5, 3, 3),
  ('Email Marketing Specialist', 'Copywriting', 'required', 1, 3, 2, 2),
  ('Email Marketing Specialist', 'Marketing Analytics', 'recommended', 1, 3, 2, 1),
  ('Performance Marketing Specialist', 'Paid Advertising (PPC)', 'required', 3, 5, 3, 3),
  ('Performance Marketing Specialist', 'Google Analytics', 'required', 2, 4, 3, 3),
  ('Performance Marketing Specialist', 'Conversion Rate Optimization', 'required', 2, 4, 3, 2),
  ('Performance Marketing Specialist', 'Marketing Analytics', 'required', 1, 3, 2, 2)
) AS v(career_title, skill_name, skill_type, min_level, target_level, importance, priority)
JOIN careers c ON c.title = v.career_title
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_id, skill_id) DO NOTHING;

-- =======================================================================
-- 5. Business & Professional careers
-- =======================================================================
INSERT INTO careers (category_id, title, slug, short_description)
SELECT (SELECT id FROM career_categories WHERE slug = 'business-professional'), d.title, d.slug, d.short_description
FROM (VALUES
  ('Business Analyst', 'business-analyst', 'Bridges business needs and solutions by analyzing processes and requirements.'),
  ('Product Manager', 'product-manager', 'Defines product direction and prioritizes what a team builds and why.'),
  ('Project Manager', 'project-manager', 'Plans, coordinates, and delivers projects on time and within scope.'),
  ('Technical Writer', 'technical-writer', 'Writes documentation that explains technical products and processes clearly.'),
  ('Sales Specialist', 'sales-specialist', 'Builds relationships and closes deals with prospective customers.'),
  ('HR/Recruitment Specialist', 'hr-recruitment-specialist', 'Manages hiring, onboarding, and people operations.'),
  ('Operations Specialist', 'operations-specialist', 'Keeps day-to-day business operations running smoothly and efficiently.'),
  ('Business Development Specialist', 'business-development-specialist', 'Identifies and develops new business opportunities and partnerships.')
) AS d(title, slug, short_description)
ON CONFLICT (title) DO NOTHING;

INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT c.id, s.id, v.skill_type, v.min_level, v.target_level, v.importance, v.priority
FROM (VALUES
  ('Business Analyst', 'Business Analysis', 'required', 2, 4, 3, 3),
  ('Business Analyst', 'Data Analysis', 'required', 2, 4, 3, 3),
  ('Business Analyst', 'Communication', 'required', 2, 4, 3, 2),
  ('Business Analyst', 'Requirements Gathering', 'required', 2, 4, 3, 3),
  ('Business Analyst', 'Documentation', 'required', 1, 3, 2, 2),
  ('Business Analyst', 'Problem Solving', 'required', 2, 4, 3, 2),
  ('Product Manager', 'Requirements Gathering', 'required', 2, 4, 3, 3),
  ('Product Manager', 'Stakeholder Management', 'required', 2, 4, 3, 3),
  ('Product Manager', 'Agile/Scrum', 'required', 1, 3, 2, 2),
  ('Product Manager', 'Data Analysis', 'required', 1, 3, 2, 2),
  ('Product Manager', 'Communication', 'required', 2, 4, 3, 2),
  ('Project Manager', 'Project Management', 'required', 3, 5, 3, 3),
  ('Project Manager', 'Agile/Scrum', 'required', 2, 4, 3, 3),
  ('Project Manager', 'Stakeholder Management', 'required', 2, 4, 3, 2),
  ('Project Manager', 'Communication', 'required', 2, 4, 3, 2),
  ('Project Manager', 'Documentation', 'recommended', 1, 3, 2, 1),
  ('Technical Writer', 'Technical Writing', 'required', 3, 5, 3, 3),
  ('Technical Writer', 'Documentation', 'required', 2, 4, 3, 3),
  ('Technical Writer', 'Communication', 'required', 2, 4, 2, 2),
  ('Technical Writer', 'Research Methods', 'recommended', 1, 3, 2, 1),
  ('Sales Specialist', 'Sales Negotiation', 'required', 2, 4, 3, 3),
  ('Sales Specialist', 'Communication', 'required', 2, 4, 3, 3),
  ('Sales Specialist', 'Business Development', 'recommended', 1, 3, 2, 2),
  ('HR/Recruitment Specialist', 'Recruitment & Talent Acquisition', 'required', 2, 4, 3, 3),
  ('HR/Recruitment Specialist', 'Communication', 'required', 2, 4, 3, 2),
  ('HR/Recruitment Specialist', 'Stakeholder Management', 'recommended', 1, 3, 2, 2),
  ('Operations Specialist', 'Operations Management', 'required', 2, 4, 3, 3),
  ('Operations Specialist', 'Process Improvement', 'required', 2, 4, 3, 2),
  ('Operations Specialist', 'Documentation', 'required', 1, 3, 2, 2),
  ('Operations Specialist', 'Data Analysis', 'recommended', 1, 3, 2, 1),
  ('Business Development Specialist', 'Business Development', 'required', 2, 4, 3, 3),
  ('Business Development Specialist', 'Sales Negotiation', 'required', 2, 4, 3, 2),
  ('Business Development Specialist', 'Communication', 'required', 2, 4, 3, 2),
  ('Business Development Specialist', 'Marketing Strategy', 'recommended', 1, 2, 1, 1)
) AS v(career_title, skill_name, skill_type, min_level, target_level, importance, priority)
JOIN careers c ON c.title = v.career_title
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_id, skill_id) DO NOTHING;

-- =======================================================================
-- 6. Knowledge & Education careers
-- =======================================================================
INSERT INTO careers (category_id, title, slug, short_description)
SELECT (SELECT id FROM career_categories WHERE slug = 'knowledge-education'), d.title, d.slug, d.short_description
FROM (VALUES
  ('Researcher', 'researcher', 'Investigates questions systematically and communicates findings.'),
  ('Technical Consultant', 'technical-consultant', 'Advises organizations on technical decisions and problems.'),
  ('Financial Analyst', 'financial-analyst', 'Analyzes financial data to guide business and investment decisions.'),
  ('Online Instructor', 'online-instructor', 'Teaches and supports learners through online courses and sessions.'),
  ('Course Creator', 'course-creator', 'Designs and produces self-paced online courses.'),
  ('Education Content Creator', 'education-content-creator', 'Produces educational content for learners across formats and platforms.')
) AS d(title, slug, short_description)
ON CONFLICT (title) DO NOTHING;

INSERT INTO career_aliases (career_id, alias)
SELECT id, lower(btrim(title)) FROM careers
ON CONFLICT (alias) DO NOTHING;

INSERT INTO career_skills (career_id, skill_id, skill_type, min_level, target_level, importance, priority)
SELECT c.id, s.id, v.skill_type, v.min_level, v.target_level, v.importance, v.priority
FROM (VALUES
  ('Researcher', 'Research Methods', 'required', 3, 5, 3, 3),
  ('Researcher', 'Academic Writing', 'required', 2, 4, 3, 3),
  ('Researcher', 'Critical Thinking', 'required', 2, 4, 3, 2),
  ('Researcher', 'Data Analysis', 'recommended', 1, 3, 2, 1),
  ('Technical Consultant', 'Subject Matter Expertise', 'required', 3, 5, 3, 3),
  ('Technical Consultant', 'Communication', 'required', 2, 4, 3, 3),
  ('Technical Consultant', 'Problem Solving', 'required', 2, 4, 3, 2),
  ('Technical Consultant', 'Documentation', 'recommended', 1, 3, 2, 1),
  ('Financial Analyst', 'Financial Analysis', 'required', 3, 5, 3, 3),
  ('Financial Analyst', 'Financial Modeling', 'required', 2, 4, 3, 3),
  ('Financial Analyst', 'Data Analysis', 'required', 1, 3, 2, 2),
  ('Financial Analyst', 'Communication', 'recommended', 1, 3, 2, 1),
  ('Online Instructor', 'Instructional Design', 'required', 2, 4, 3, 3),
  ('Online Instructor', 'Public Speaking', 'required', 2, 4, 3, 2),
  ('Online Instructor', 'Subject Matter Expertise', 'required', 2, 4, 3, 2),
  ('Online Instructor', 'Curriculum Design', 'recommended', 1, 3, 2, 1),
  ('Course Creator', 'Curriculum Design', 'required', 3, 5, 3, 3),
  ('Course Creator', 'Instructional Design', 'required', 2, 4, 3, 3),
  ('Course Creator', 'Content Creation', 'required', 1, 3, 2, 2),
  ('Course Creator', 'Video Editing', 'recommended', 1, 3, 2, 1),
  ('Education Content Creator', 'Content Creation', 'required', 3, 5, 3, 3),
  ('Education Content Creator', 'Subject Matter Expertise', 'required', 2, 4, 3, 2),
  ('Education Content Creator', 'Video Editing', 'recommended', 1, 3, 2, 2),
  ('Education Content Creator', 'Public Speaking', 'recommended', 1, 3, 2, 1)
) AS v(career_title, skill_name, skill_type, min_level, target_level, importance, priority)
JOIN careers c ON c.title = v.career_title
JOIN skills s ON s.name = v.skill_name
ON CONFLICT (career_id, skill_id) DO NOTHING;
