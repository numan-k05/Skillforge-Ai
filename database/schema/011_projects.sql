-- =====================================================================
-- SkillForge AI — Phase 7A database schema (Projects Engine)
-- Adds a reusable project catalog, career/skill mappings, milestones,
-- and per-user project selection/status tracking.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS projects (
  id                 BIGSERIAL PRIMARY KEY,
  title              VARCHAR(200) NOT NULL UNIQUE,
  slug               VARCHAR(220) NOT NULL UNIQUE,
  short_description  TEXT NOT NULL,
  description        TEXT,
  difficulty         VARCHAR(20) NOT NULL DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours    SMALLINT CHECK (estimated_hours IS NULL OR estimated_hours BETWEEN 1 AND 1000),
  project_type       VARCHAR(30) NOT NULL DEFAULT 'portfolio'
    CHECK (project_type IN ('practice', 'portfolio', 'capstone')),
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects (difficulty);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects (project_type);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects (is_active);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS project_skills (
  id          BIGSERIAL PRIMARY KEY,
  project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  skill_id    BIGINT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  importance  SMALLINT NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  CONSTRAINT uq_project_skills UNIQUE (project_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills (project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id ON project_skills (skill_id);

CREATE TABLE IF NOT EXISTS career_projects (
  id          BIGSERIAL PRIMARY KEY,
  career_id   BIGINT NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
  project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  relevance   SMALLINT NOT NULL DEFAULT 2 CHECK (relevance BETWEEN 1 AND 3),
  CONSTRAINT uq_career_projects UNIQUE (career_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_career_projects_career_id ON career_projects (career_id);
CREATE INDEX IF NOT EXISTS idx_career_projects_project_id ON career_projects (project_id);

CREATE TABLE IF NOT EXISTS project_milestones (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  milestone_order SMALLINT NOT NULL CHECK (milestone_order >= 1),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  estimated_hours SMALLINT CHECK (estimated_hours IS NULL OR estimated_hours BETWEEN 1 AND 500),
  CONSTRAINT uq_project_milestones_order UNIQUE (project_id, milestone_order)
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones (project_id);

CREATE TABLE IF NOT EXISTS user_projects (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  project_id   BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_projects UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects (project_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects (status);

DROP TRIGGER IF EXISTS trg_user_projects_updated_at ON user_projects;
CREATE TRIGGER trg_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Seed a focused initial project catalog. More projects can be added
-- later without changing the schema.
-- ---------------------------------------------------------------------
INSERT INTO projects
  (title, slug, short_description, description, difficulty, estimated_hours, project_type)
VALUES
  ('Responsive Portfolio Website', 'responsive-portfolio-website', 'Build a polished responsive portfolio from scratch.', 'Create a personal portfolio with accessible navigation, project sections, responsive layouts, and a contact section.', 'beginner', 12, 'portfolio'),
  ('Interactive JavaScript Dashboard', 'interactive-javascript-dashboard', 'Build a data-driven dashboard with interactive UI.', 'Create a dashboard that loads structured data, filters records, renders charts or summaries, and handles loading and error states.', 'intermediate', 24, 'portfolio'),
  ('Full-Stack Task Manager', 'full-stack-task-manager', 'Build a complete task management application.', 'Create authentication, CRUD task APIs, a responsive frontend, validation, and persistent PostgreSQL storage.', 'intermediate', 36, 'capstone'),
  ('REST API for a Student Platform', 'student-platform-rest-api', 'Design and implement a production-style REST API.', 'Build authenticated endpoints for profiles, resources, validation, errors, and pagination with clear API conventions.', 'intermediate', 28, 'portfolio'),
  ('React E-Commerce Store', 'react-ecommerce-store', 'Build a modern e-commerce frontend with reusable components.', 'Create product browsing, search, filters, product details, cart state, and responsive UI using React.', 'intermediate', 30, 'portfolio'),
  ('Python Automation Toolkit', 'python-automation-toolkit', 'Create useful Python scripts that automate repetitive tasks.', 'Build a small command-line toolkit for file organization, reporting, data cleanup, or other safe developer workflows.', 'beginner', 14, 'practice'),
  ('Data Analysis Mini Project', 'data-analysis-mini-project', 'Turn a dataset into useful insights.', 'Clean a dataset, calculate meaningful metrics, explore trends, and communicate findings with clear visualizations.', 'beginner', 18, 'portfolio'),
  ('SQL Analytics Database', 'sql-analytics-database', 'Design a relational database and analytical queries.', 'Model a realistic dataset, normalize tables, add constraints and indexes, and write reporting queries.', 'intermediate', 20, 'portfolio'),
  ('Automated Testing Project', 'automated-testing-project', 'Build a small application with a reliable test suite.', 'Add unit and integration tests, meaningful test cases, and automated validation for common failure scenarios.', 'intermediate', 22, 'portfolio'),
  ('Cloud Deployment Starter', 'cloud-deployment-starter', 'Deploy a small application with a repeatable workflow.', 'Package an application, configure environment variables safely, document deployment, and add a simple CI/CD workflow.', 'advanced', 26, 'portfolio'),
  ('UI/UX Mobile App Prototype', 'uiux-mobile-app-prototype', 'Design a complete mobile app experience.', 'Research a user problem, define flows, create wireframes, and produce a polished high-fidelity prototype.', 'beginner', 18, 'portfolio'),
  ('Brand Identity Starter Kit', 'brand-identity-starter-kit', 'Create a cohesive visual identity for a small brand.', 'Develop a logo direction, typography, color system, social assets, and a concise brand usage guide.', 'beginner', 16, 'portfolio'),
  ('Short-Form Video Campaign', 'short-form-video-campaign', 'Plan and produce a small social video campaign.', 'Create a campaign concept, storyboard short videos, edit them consistently, and document the content strategy.', 'intermediate', 20, 'portfolio'),
  ('SEO Content Website', 'seo-content-website', 'Build a content site optimized for discoverability.', 'Create structured pages, useful content, metadata, internal linking, and an analytics-ready information architecture.', 'intermediate', 20, 'portfolio'),
  ('Social Media Content System', 'social-media-content-system', 'Design a repeatable content system for a brand.', 'Build a content calendar, reusable post formats, audience themes, and a measurement plan.', 'beginner', 12, 'practice'),
  ('Marketing Performance Dashboard', 'marketing-performance-dashboard', 'Analyze campaign performance in one dashboard.', 'Combine campaign metrics, define KPIs, identify trends, and present actionable recommendations.', 'intermediate', 24, 'portfolio'),
  ('Business Requirements Case Study', 'business-requirements-case-study', 'Turn a business problem into a structured solution proposal.', 'Interview stakeholders in a simulated scenario, document requirements, map processes, and recommend a solution.', 'beginner', 14, 'portfolio'),
  ('Agile Product Planning Case Study', 'agile-product-planning-case-study', 'Plan a small product from idea to delivery.', 'Define users, outcomes, backlog items, priorities, acceptance criteria, and an iterative delivery plan.', 'intermediate', 18, 'portfolio'),
  ('Financial Analysis Report', 'financial-analysis-report', 'Analyze a company-style financial dataset.', 'Build a clean analysis model, calculate key metrics, identify trends, and present evidence-based conclusions.', 'intermediate', 22, 'portfolio'),
  ('Research Study Mini Project', 'research-study-mini-project', 'Design and communicate a small research study.', 'Define a research question, choose a method, organize evidence, analyze findings, and present limitations clearly.', 'intermediate', 24, 'portfolio'),
  ('Technical Documentation Site', 'technical-documentation-site', 'Create clear documentation for a technical product.', 'Write structured guides, API or feature references, examples, navigation, and troubleshooting content.', 'beginner', 14, 'portfolio'),
  ('Online Course Prototype', 'online-course-prototype', 'Design a short self-paced learning experience.', 'Define learning outcomes, structure lessons, create exercises, and build a learner-friendly course prototype.', 'intermediate', 20, 'portfolio'),
  ('Android Habit Tracker', 'android-habit-tracker', 'Build a native Android habit-tracking app.', 'Create screens, local data handling, user interactions, and a clean native Android experience.', 'intermediate', 28, 'portfolio'),
  ('iOS Personal Planner', 'ios-personal-planner', 'Build a native iOS planning application.', 'Create a focused planner with native navigation, local state, forms, and a polished mobile experience.', 'intermediate', 28, 'portfolio'),
  ('Game Development Mini Game', 'game-development-mini-game', 'Build a small playable game prototype.', 'Create a simple game loop, player controls, scoring, basic assets, and a clear win/lose condition.', 'intermediate', 30, 'portfolio'),
  ('3D Product Visualization', '3d-product-visualization', 'Create a polished 3D product scene.', 'Model a simple product, apply materials, light the scene, and produce presentation-ready renders.', 'intermediate', 24, 'portfolio'),
  ('Motion Graphics Explainer', 'motion-graphics-explainer', 'Create a short motion-graphics explainer.', 'Plan the story, design visual assets, animate transitions, and export a concise polished explainer.', 'intermediate', 22, 'portfolio'),
  ('Photography Portfolio Series', 'photography-portfolio-series', 'Create a themed photography portfolio series.', 'Plan a visual theme, capture a consistent set of images, edit them, and present the final collection.', 'beginner', 16, 'portfolio'),
  ('Operations Process Improvement Case Study', 'operations-process-improvement-case-study', 'Improve a simulated business workflow.', 'Map a process, identify bottlenecks, propose improvements, and define measurable outcomes.', 'intermediate', 18, 'portfolio'),
  ('Recruitment Pipeline Case Study', 'recruitment-pipeline-case-study', 'Design a structured recruitment workflow.', 'Create a candidate pipeline, screening criteria, interview stages, documentation, and basic hiring metrics.', 'beginner', 14, 'portfolio')
ON CONFLICT (slug) DO NOTHING;

-- Project -> skill mappings. Only existing catalog skills are linked.
INSERT INTO project_skills (project_id, skill_id, importance)
SELECT p.id, s.id, x.importance
FROM (VALUES
  ('responsive-portfolio-website', 'HTML/CSS', 3),
  ('responsive-portfolio-website', 'JavaScript', 2),
  ('interactive-javascript-dashboard', 'JavaScript', 3),
  ('interactive-javascript-dashboard', 'Data Analysis', 2),
  ('full-stack-task-manager', 'JavaScript', 3),
  ('full-stack-task-manager', 'React', 3),
  ('full-stack-task-manager', 'Node.js', 3),
  ('full-stack-task-manager', 'SQL', 3),
  ('full-stack-task-manager', 'REST API Design', 3),
  ('student-platform-rest-api', 'Node.js', 3),
  ('student-platform-rest-api', 'REST API Design', 3),
  ('student-platform-rest-api', 'SQL', 2),
  ('react-ecommerce-store', 'React', 3),
  ('react-ecommerce-store', 'JavaScript', 3),
  ('react-ecommerce-store', 'Git', 2),
  ('python-automation-toolkit', 'Python', 3),
  ('data-analysis-mini-project', 'Python', 3),
  ('data-analysis-mini-project', 'Data Analysis', 3),
  ('sql-analytics-database', 'SQL', 3),
  ('sql-analytics-database', 'Database Design', 3),
  ('automated-testing-project', 'Test Automation', 3),
  ('automated-testing-project', 'Unit Testing', 3),
  ('cloud-deployment-starter', 'Cloud Computing (AWS/Azure/GCP)', 3),
  ('cloud-deployment-starter', 'Docker', 3),
  ('cloud-deployment-starter', 'CI/CD', 3),
  ('uiux-mobile-app-prototype', 'Mobile UI Design', 3),
  ('uiux-mobile-app-prototype', 'Layout Design', 2),
  ('uiux-mobile-app-prototype', 'Color Theory', 2),
  ('brand-identity-starter-kit', 'Branding', 3),
  ('brand-identity-starter-kit', 'Typography', 3),
  ('brand-identity-starter-kit', 'Color Theory', 3),
  ('short-form-video-campaign', 'Video Editing', 3),
  ('short-form-video-campaign', 'Storyboarding', 3),
  ('short-form-video-campaign', 'Content Creation', 2),
  ('seo-content-website', 'SEO', 3),
  ('seo-content-website', 'Content Marketing', 2),
  ('social-media-content-system', 'Social Media Marketing', 3),
  ('social-media-content-system', 'Content Creation', 3),
  ('marketing-performance-dashboard', 'Marketing Analytics', 3),
  ('marketing-performance-dashboard', 'Google Analytics', 2),
  ('business-requirements-case-study', 'Business Analysis', 3),
  ('business-requirements-case-study', 'Requirements Gathering', 3),
  ('business-requirements-case-study', 'Communication', 2),
  ('agile-product-planning-case-study', 'Business Analysis', 2),
  ('agile-product-planning-case-study', 'Agile/Scrum', 3),
  ('agile-product-planning-case-study', 'Project Management', 2),
  ('financial-analysis-report', 'Financial Analysis', 3),
  ('financial-analysis-report', 'Financial Modeling', 3),
  ('research-study-mini-project', 'Research Methods', 3),
  ('research-study-mini-project', 'Critical Thinking', 2),
  ('technical-documentation-site', 'Technical Writing', 3),
  ('technical-documentation-site', 'Documentation', 3),
  ('online-course-prototype', 'Instructional Design', 3),
  ('online-course-prototype', 'Curriculum Design', 3),
  ('android-habit-tracker', 'Kotlin', 3),
  ('android-habit-tracker', 'Mobile UI Design', 2),
  ('ios-personal-planner', 'Swift', 3),
  ('ios-personal-planner', 'Mobile UI Design', 2),
  ('game-development-mini-game', 'Game Development (Unity/Unreal)', 3),
  ('game-development-mini-game', 'Data Structures & Algorithms', 2),
  ('3d-product-visualization', '3D Modeling', 3),
  ('3d-product-visualization', 'Photography', 1),
  ('motion-graphics-explainer', 'Motion Graphics', 3),
  ('motion-graphics-explainer', 'Adobe After Effects', 3),
  ('photography-portfolio-series', 'Photography', 3),
  ('operations-process-improvement-case-study', 'Process Improvement', 3),
  ('operations-process-improvement-case-study', 'Operations Management', 3),
  ('recruitment-pipeline-case-study', 'Recruitment & Talent Acquisition', 3),
  ('recruitment-pipeline-case-study', 'Communication', 2)
) AS x(project_slug, skill_name, importance)
JOIN projects p ON p.slug = x.project_slug
JOIN skills s ON s.name = x.skill_name
ON CONFLICT (project_id, skill_id) DO NOTHING;

-- Career mappings. Relevance 3 = strongest portfolio fit.
INSERT INTO career_projects (career_id, project_id, relevance)
SELECT c.id, p.id, x.relevance
FROM (VALUES
  ('Software Engineer', 'full-stack-task-manager', 3),
  ('Software Engineer', 'automated-testing-project', 2),
  ('Software Engineer', 'student-platform-rest-api', 3),
  ('Frontend Developer', 'responsive-portfolio-website', 3),
  ('Frontend Developer', 'react-ecommerce-store', 3),
  ('Frontend Developer', 'interactive-javascript-dashboard', 3),
  ('Backend Developer', 'student-platform-rest-api', 3),
  ('Backend Developer', 'full-stack-task-manager', 3),
  ('Backend Developer', 'sql-analytics-database', 2),
  ('Full Stack Developer', 'full-stack-task-manager', 3),
  ('Full Stack Developer', 'react-ecommerce-store', 3),
  ('Full Stack Developer', 'student-platform-rest-api', 3),
  ('React Developer', 'react-ecommerce-store', 3),
  ('React Developer', 'interactive-javascript-dashboard', 3),
  ('React Developer', 'responsive-portfolio-website', 2),
  ('Python Developer', 'python-automation-toolkit', 3),
  ('Python Developer', 'data-analysis-mini-project', 2),
  ('Python Developer', 'student-platform-rest-api', 2),
  ('Mobile App Developer', 'android-habit-tracker', 3),
  ('Mobile App Developer', 'ios-personal-planner', 3),
  ('Android Developer', 'android-habit-tracker', 3),
  ('iOS Developer', 'ios-personal-planner', 3),
  ('AI / Machine Learning Engineer', 'data-analysis-mini-project', 3),
  ('AI / Machine Learning Engineer', 'python-automation-toolkit', 2),
  ('Data Analyst', 'data-analysis-mini-project', 3),
  ('Data Analyst', 'sql-analytics-database', 3),
  ('Data Analyst', 'marketing-performance-dashboard', 2),
  ('Data Scientist', 'data-analysis-mini-project', 3),
  ('Data Scientist', 'sql-analytics-database', 2),
  ('DevOps Engineer', 'cloud-deployment-starter', 3),
  ('Cloud Engineer', 'cloud-deployment-starter', 3),
  ('QA Engineer', 'automated-testing-project', 3),
  ('Database Engineer', 'sql-analytics-database', 3),
  ('Game Developer', 'game-development-mini-game', 3),
  ('UI/UX Designer', 'uiux-mobile-app-prototype', 3),
  ('Graphic Designer', 'brand-identity-starter-kit', 3),
  ('Video Editor', 'short-form-video-campaign', 3),
  ('Motion Graphics Designer', 'motion-graphics-explainer', 3),
  ('3D Artist', '3d-product-visualization', 3),
  ('Animator', 'motion-graphics-explainer', 2),
  ('Photographer', 'photography-portfolio-series', 3),
  ('Brand Designer', 'brand-identity-starter-kit', 3),
  ('Digital Marketer', 'marketing-performance-dashboard', 3),
  ('SEO Specialist', 'seo-content-website', 3),
  ('Social Media Manager', 'social-media-content-system', 3),
  ('Content Strategist', 'social-media-content-system', 3),
  ('Copywriter', 'seo-content-website', 2),
  ('E-commerce Specialist', 'react-ecommerce-store', 2),
  ('Business Analyst', 'business-requirements-case-study', 3),
  ('Product Manager', 'agile-product-planning-case-study', 3),
  ('Project Manager', 'agile-product-planning-case-study', 3),
  ('Technical Writer', 'technical-documentation-site', 3),
  ('Technical Consultant', 'business-requirements-case-study', 2),
  ('Financial Analyst', 'financial-analysis-report', 3),
  ('Researcher', 'research-study-mini-project', 3),
  ('Online Instructor', 'online-course-prototype', 3),
  ('Course Creator', 'online-course-prototype', 3),
  ('Education Content Creator', 'online-course-prototype', 3),
  ('Operations Specialist', 'operations-process-improvement-case-study', 3),
  ('HR/Recruitment Specialist', 'recruitment-pipeline-case-study', 3),
  ('Business Development Specialist', 'business-requirements-case-study', 2)
) AS x(career_title, project_slug, relevance)
JOIN careers c ON c.title = x.career_title
JOIN projects p ON p.slug = x.project_slug
ON CONFLICT (career_id, project_id) DO NOTHING;

-- Milestones are reusable project structure, not per-user progress yet.
INSERT INTO project_milestones (project_id, milestone_order, title, description, estimated_hours)
SELECT p.id, m.milestone_order, m.title, m.description, m.estimated_hours
FROM (VALUES
  ('responsive-portfolio-website', 1, 'Plan and structure', 'Define sections, content, and page structure before coding.', 2),
  ('responsive-portfolio-website', 2, 'Build responsive UI', 'Implement semantic HTML and responsive CSS.', 7),
  ('responsive-portfolio-website', 3, 'Polish and publish', 'Add interactions, test mobile layouts, and prepare the project for sharing.', 3),
  ('full-stack-task-manager', 1, 'Design data and API', 'Define entities, database tables, API routes, and validation.', 8),
  ('full-stack-task-manager', 2, 'Build backend', 'Implement authentication, CRUD operations, and database access.', 12),
  ('full-stack-task-manager', 3, 'Build frontend', 'Connect the React UI to the API and handle states cleanly.', 12),
  ('full-stack-task-manager', 4, 'Test and document', 'Test important flows and document setup and API usage.', 4),
  ('student-platform-rest-api', 1, 'Design endpoints', 'Plan resources, routes, request shapes, and response conventions.', 6),
  ('student-platform-rest-api', 2, 'Implement API', 'Build authenticated routes, validation, and database queries.', 16),
  ('student-platform-rest-api', 3, 'Test and document', 'Cover key cases and create clear API documentation.', 6),
  ('react-ecommerce-store', 1, 'Create component system', 'Plan reusable components and page structure.', 6),
  ('react-ecommerce-store', 2, 'Build shopping experience', 'Implement product listing, details, search, filters, and cart state.', 16),
  ('react-ecommerce-store', 3, 'Polish and test', 'Improve responsiveness, accessibility, and interaction states.', 8),
  ('data-analysis-mini-project', 1, 'Prepare data', 'Inspect, clean, and structure the dataset.', 5),
  ('data-analysis-mini-project', 2, 'Analyze', 'Calculate metrics, explore patterns, and investigate useful questions.', 8),
  ('data-analysis-mini-project', 3, 'Communicate findings', 'Create clear visuals and a concise findings report.', 5),
  ('sql-analytics-database', 1, 'Model database', 'Design normalized tables, keys, and relationships.', 6),
  ('sql-analytics-database', 2, 'Implement queries', 'Write joins, aggregations, subqueries, and useful reports.', 9),
  ('sql-analytics-database', 3, 'Optimize and document', 'Add sensible indexes and explain the design decisions.', 5),
  ('automated-testing-project', 1, 'Define test strategy', 'Identify critical behaviors and failure cases.', 4),
  ('automated-testing-project', 2, 'Write tests', 'Build unit and integration coverage for important paths.', 13),
  ('automated-testing-project', 3, 'Automate validation', 'Run tests consistently and document the workflow.', 5),
  ('cloud-deployment-starter', 1, 'Prepare application', 'Configure production-safe environment settings and build output.', 6),
  ('cloud-deployment-starter', 2, 'Deploy', 'Deploy the application and verify core functionality.', 12),
  ('cloud-deployment-starter', 3, 'Automate delivery', 'Add a basic CI/CD workflow and deployment documentation.', 8)
) AS m(project_slug, milestone_order, title, description, estimated_hours)
JOIN projects p ON p.slug = m.project_slug
ON CONFLICT (project_id, milestone_order) DO NOTHING;

COMMIT;
