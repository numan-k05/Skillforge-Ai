BEGIN;

-- Career Bundles use the existing permanent-access product model. Only careers
-- whose component Skill Passes are complete are published here.
CREATE TEMP TABLE sf_career_bundles (
  career_slug text PRIMARY KEY,
  product_name text NOT NULL,
  product_slug text NOT NULL UNIQUE,
  certificate_title text NOT NULL,
  certificate_slug text NOT NULL UNIQUE,
  skill_names text[] NOT NULL,
  required_project_slugs text[] NOT NULL
) ON COMMIT DROP;

INSERT INTO sf_career_bundles VALUES
('frontend-developer','Frontend Developer Career Bundle','frontend-developer-career-bundle','Frontend Developer Career Completion','frontend-developer-career-completion',
 ARRAY['HTML/CSS','JavaScript','React','Git'],
 ARRAY['accessible-product-landing-site','javascript-service-monitor','react-productivity-dashboard','git-collaboration-lab']),
('backend-developer','Backend Developer Career Bundle','backend-developer-career-bundle','Backend Developer Career Completion','backend-developer-career-completion',
 ARRAY['JavaScript','Node.js','SQL','Git','Data Structures & Algorithms'],
 ARRAY['javascript-service-monitor','nodejs-booking-api','sql-operations-reporting-system','git-collaboration-lab','algorithm-route-planner']),
('full-stack-developer','Full Stack Developer Career Bundle','full-stack-developer-career-bundle','Full Stack Developer Career Completion','full-stack-developer-career-completion',
 ARRAY['HTML/CSS','JavaScript','React','Node.js','SQL','Git'],
 ARRAY['accessible-product-landing-site','javascript-service-monitor','react-productivity-dashboard','nodejs-booking-api','sql-operations-reporting-system','git-collaboration-lab']),
('python-developer','Python Developer Career Bundle','python-developer-career-bundle','Python Developer Career Completion','python-developer-career-completion',
 ARRAY['Python','SQL','Git','Data Structures & Algorithms'],
 ARRAY['python-data-intake-pipeline','sql-operations-reporting-system','git-collaboration-lab','algorithm-route-planner']),
('data-analyst','Data Analyst Career Bundle','data-analyst-career-bundle','Data Analyst Career Completion','data-analyst-career-completion',
 ARRAY['Python','SQL','Git'],
 ARRAY['python-data-intake-pipeline','sql-operations-reporting-system','git-collaboration-lab']);

INSERT INTO products(name,slug,description,status)
SELECT b.product_name,b.product_slug,
  'Permanent access to the completed Skill Pass tracks, assessments, portfolio projects, and career certificate for the '||c.title||' path.',
  'active'
FROM sf_career_bundles b JOIN careers c ON c.slug=b.career_slug
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,status='active';

INSERT INTO product_skills(product_id,skill_id)
SELECT p.id,s.id
FROM sf_career_bundles b JOIN products p ON p.slug=b.product_slug
JOIN skills s ON s.name=ANY(b.skill_names)
ON CONFLICT DO NOTHING;

INSERT INTO product_prices(product_id,currency,amount_minor,is_active)
SELECT p.id,'USD',4999,TRUE
FROM sf_career_bundles b JOIN products p ON p.slug=b.product_slug
ON CONFLICT(product_id,currency) DO UPDATE SET amount_minor=EXCLUDED.amount_minor,is_active=TRUE;

INSERT INTO certificate_definitions(title,slug,description,required_readiness_score,is_active)
SELECT b.certificate_title,b.certificate_slug,
  'Verified completion of every included Skill Pass lesson and final assessment, the required reviewer-approved portfolio projects, and the career evidence-readiness requirement.',
  60,TRUE
FROM sf_career_bundles b
ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,
  required_readiness_score=EXCLUDED.required_readiness_score,is_active=TRUE;

INSERT INTO certificate_required_lessons(definition_id,lesson_id)
SELECT DISTINCT d.id,cl.id
FROM sf_career_bundles b JOIN certificate_definitions d ON d.slug=b.certificate_slug
JOIN skills s ON s.name=ANY(b.skill_names) JOIN courses c ON c.skill_id=s.id AND c.status='published'
JOIN course_modules cm ON cm.course_id=c.id JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE
ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_quizzes(definition_id,quiz_id)
SELECT DISTINCT d.id,q.id
FROM sf_career_bundles b JOIN certificate_definitions d ON d.slug=b.certificate_slug
JOIN skills s ON s.name=ANY(b.skill_names) JOIN courses c ON c.skill_id=s.id AND c.status='published'
JOIN quizzes q ON q.course_id=c.id
WHERE EXISTS(SELECT 1 FROM quiz_versions qv WHERE qv.quiz_id=q.id AND qv.status='published')
ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_projects(definition_id,project_id)
SELECT d.id,pr.id
FROM sf_career_bundles b JOIN certificate_definitions d ON d.slug=b.certificate_slug
JOIN projects pr ON pr.slug=ANY(b.required_project_slugs)
ON CONFLICT DO NOTHING;

-- A bundle grants the same courses, assessments, and premium projects as its
-- component Skill Passes, plus its own career-level certificate.
INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT DISTINCT rules.entity_type,rules.entity_id,bundle.id
FROM sf_career_bundles b JOIN products bundle ON bundle.slug=b.product_slug
JOIN skills s ON s.name=ANY(b.skill_names)
JOIN product_skills component_skill ON component_skill.skill_id=s.id
JOIN products component ON component.id=component_skill.product_id AND component.slug LIKE '%-skill-pass'
JOIN premium_content_rules rules ON rules.product_id=component.id AND rules.entity_type IN('course','quiz','project')
ON CONFLICT(entity_type,entity_id,product_id) DO NOTHING;

INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT 'certificate',d.id,p.id
FROM sf_career_bundles b JOIN products p ON p.slug=b.product_slug
JOIN certificate_definitions d ON d.slug=b.certificate_slug
ON CONFLICT(entity_type,entity_id,product_id) DO NOTHING;

-- Fill the four remaining career paths that had no practical project.
CREATE TEMP TABLE sf_missing_career_projects (
  career_slug text PRIMARY KEY, title text NOT NULL, project_slug text NOT NULL UNIQUE,
  short_description text NOT NULL, description text NOT NULL, estimated_hours integer NOT NULL
) ON COMMIT DROP;

INSERT INTO sf_missing_career_projects VALUES
('content-creator','Multi-Channel Content Campaign','multi-channel-content-campaign',
 'Plan, produce, and evaluate a coordinated content campaign.',
 'Research an audience, define a content strategy, produce written and visual assets for two channels, create a publishing calendar, and evaluate the work against clear engagement goals.',24),
('email-marketing-specialist','Lifecycle Email Campaign','lifecycle-email-campaign',
 'Design an ethical email sequence with measurable lifecycle goals.',
 'Create a segmented welcome and re-engagement sequence with strong copy, accessible templates, consent and unsubscribe handling, test cases, and a measurement plan.',22),
('performance-marketing-specialist','Performance Campaign Optimization','performance-campaign-optimization',
 'Plan and optimize a paid campaign from evidence.',
 'Define acquisition targets, organize campaigns and creative tests, model budget and conversion economics, analyze a realistic results dataset, and recommend controlled optimizations.',26),
('sales-specialist','Consultative Sales Pipeline','consultative-sales-pipeline',
 'Build and demonstrate a transparent consultative sales process.',
 'Create an ideal-customer profile, discovery guide, qualification rubric, proposal, objection responses, negotiation plan, and a pipeline report with clear next actions.',20);

INSERT INTO projects(title,slug,short_description,description,difficulty,estimated_hours,project_type,is_active)
SELECT title,project_slug,short_description,description,'intermediate',estimated_hours,'portfolio',TRUE
FROM sf_missing_career_projects
ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,short_description=EXCLUDED.short_description,
  description=EXCLUDED.description,difficulty=EXCLUDED.difficulty,estimated_hours=EXCLUDED.estimated_hours,
  project_type=EXCLUDED.project_type,is_active=TRUE;

INSERT INTO career_projects(career_id,project_id,relevance)
SELECT c.id,p.id,3 FROM sf_missing_career_projects m
JOIN careers c ON c.slug=m.career_slug JOIN projects p ON p.slug=m.project_slug
ON CONFLICT(career_id,project_id) DO UPDATE SET relevance=EXCLUDED.relevance;

INSERT INTO project_skills(project_id,skill_id,importance)
SELECT DISTINCT p.id,cs.skill_id,LEAST(3,GREATEST(1,cs.importance))
FROM sf_missing_career_projects m JOIN careers c ON c.slug=m.career_slug
JOIN career_skills cs ON cs.career_id=c.id JOIN projects p ON p.slug=m.project_slug
ON CONFLICT(project_id,skill_id) DO UPDATE SET importance=EXCLUDED.importance;

INSERT INTO project_milestones(project_id,milestone_order,title,description,estimated_hours)
SELECT p.id,m.position,m.title,m.description,m.hours
FROM sf_missing_career_projects cp JOIN projects p ON p.slug=cp.project_slug
CROSS JOIN (VALUES
 (1,'Define the audience and outcome','Document the intended audience, business or communication goal, constraints, success measures, and ethical boundaries.',4),
 (2,'Create the working deliverables','Build the central campaign or sales assets with clear rationale and versioned evidence of the work.',10),
 (3,'Validate with realistic scenarios','Check quality, accessibility, consent, edge cases, measurement accuracy, and the response to weak results.',6),
 (4,'Present findings and next actions','Package the deliverables, results, limitations, and a prioritized improvement plan for review.',4)
) m(position,title,description,hours)
ON CONFLICT(project_id,milestone_order) DO UPDATE SET title=EXCLUDED.title,
  description=EXCLUDED.description,estimated_hours=EXCLUDED.estimated_hours;

COMMIT;
