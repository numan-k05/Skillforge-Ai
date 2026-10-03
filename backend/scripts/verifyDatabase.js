import "dotenv/config";
import pg from "pg";

const { Client } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const client = new Client({ connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false });
try {
  await client.connect();
  const result = await client.query(`SELECT
    (SELECT COUNT(*)::int FROM skillforge_schema_migrations) AS migration_count,
    EXISTS(SELECT 1 FROM skillforge_schema_migrations WHERE filename='045_monthly_subscription.sql') AS latest_migration,
    (SELECT COUNT(*)::int FROM skills) AS skill_count,
    (SELECT COUNT(*)::int FROM products p JOIN product_prices pp ON pp.product_id=p.id WHERE p.product_type='skill_pass' AND p.status='active' AND pp.currency='PKR' AND pp.amount_minor=99900 AND pp.is_active=TRUE) AS pkr_skill_pass_count,
    (SELECT COUNT(*)::int FROM products p JOIN product_prices pp ON pp.product_id=p.id WHERE p.product_type='career_bundle' AND p.status='active' AND pp.currency='PKR' AND pp.amount_minor=199900 AND pp.is_active=TRUE) AS pkr_career_bundle_count,
    EXISTS(SELECT 1 FROM products p JOIN product_prices pp ON pp.product_id=p.id WHERE p.slug='skillforge-pro-monthly' AND p.product_type='subscription' AND p.access_duration_days=30 AND p.status='active' AND pp.currency='PKR' AND pp.amount_minor=64900 AND pp.is_active=TRUE) AS monthly_subscription_ready,
    (SELECT COUNT(*)::int FROM courses WHERE status='published') AS published_course_count,
    (SELECT COUNT(*)::int FROM course_lessons WHERE is_active=TRUE AND source_resource_id IS NOT NULL) AS attributed_lesson_count,
    (SELECT COUNT(*)::int FROM quiz_versions qv WHERE qv.status='published' AND EXISTS (SELECT 1 FROM quiz_questions qq WHERE qq.quiz_version_id=qv.id)) AS published_assessment_count,
    (SELECT COUNT(*)::int FROM (SELECT LOWER(name) FROM skills GROUP BY LOWER(name) HAVING COUNT(*)>1) duplicates) AS duplicate_skills,
    (SELECT COUNT(*)::int FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id JOIN courses c ON c.id=cm.course_id WHERE c.slug='react-foundations' AND cl.is_active=TRUE) AS react_lesson_count,
    (SELECT COUNT(*)::int FROM quiz_questions qq JOIN quiz_versions qv ON qv.id=qq.quiz_version_id JOIN quizzes q ON q.id=qv.quiz_id JOIN courses c ON c.id=q.course_id WHERE c.slug='react-foundations' AND qv.status='published') AS react_question_count,
    EXISTS(SELECT 1 FROM products WHERE slug='react-skill-pass' AND status='active') AS react_product_active,
    EXISTS(SELECT 1 FROM product_prices pp JOIN products p ON p.id=pp.product_id WHERE p.slug='react-skill-pass' AND pp.currency='USD' AND pp.amount_minor=1899 AND pp.is_active=TRUE) AS react_price_ready,
    EXISTS(SELECT 1 FROM certificate_definitions WHERE slug='react-skill-pass-completion' AND is_active=TRUE) AS react_certificate_ready,
    (SELECT COUNT(*)::int FROM certificate_required_projects rp JOIN certificate_definitions d ON d.id=rp.definition_id WHERE d.slug='react-skill-pass-completion') AS react_required_projects,
    (SELECT COUNT(*)::int FROM premium_content_rules r JOIN products p ON p.id=r.product_id WHERE p.slug='react-skill-pass') AS react_premium_rules`);
  const check = result.rows[0];
  const catalogResult = await client.query(`SELECT
    (SELECT COUNT(*)::int FROM (
      SELECT c.id FROM courses c JOIN course_modules cm ON cm.course_id=c.id JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE
      WHERE c.slug=ANY($1::text[]) GROUP BY c.id HAVING COUNT(cl.id)>=12
    ) complete) AS complete_track_count,
    (SELECT COUNT(*)::int FROM (
      SELECT c.id FROM courses c JOIN quizzes q ON q.course_id=c.id JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.status='published'
      JOIN quiz_questions qq ON qq.quiz_version_id=qv.id WHERE c.slug=ANY($1::text[])
      GROUP BY c.id HAVING COUNT(qq.id)>=12
    ) complete) AS complete_assessment_count,
    (SELECT COUNT(*)::int FROM products p JOIN product_prices pp ON pp.product_id=p.id
      WHERE p.slug=ANY($2::text[]) AND p.status='active' AND pp.currency='USD' AND pp.amount_minor=1899 AND pp.is_active=TRUE) AS prepared_product_count,
    (SELECT COUNT(*)::int FROM (
      SELECT d.id FROM certificate_definitions d JOIN certificate_required_projects rp ON rp.definition_id=d.id
      WHERE d.slug=ANY($3::text[]) AND d.is_active=TRUE GROUP BY d.id HAVING COUNT(rp.project_id)>=2
    ) complete) AS prepared_certificate_count,
    (SELECT COUNT(*)::int FROM (
      SELECT p.id FROM products p JOIN premium_content_rules r ON r.product_id=p.id
      WHERE p.slug=ANY($2::text[]) GROUP BY p.id HAVING COUNT(r.id)>=5
    ) complete) AS protected_product_count,
    (SELECT COUNT(*)::int FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id JOIN courses c ON c.id=cm.course_id
      LEFT JOIN learning_resources lr ON lr.id=cl.source_resource_id
      WHERE c.slug=ANY($1::text[]) AND cl.is_active=TRUE AND COALESCE(lr.url,cl.source_url) IS NOT NULL) AS linked_lesson_count`,[
      ['javascript-foundations','python-foundations','sql-foundations','react-foundations','nodejs-foundations','git-foundations','data-structures-algorithms-foundations','html-css-foundations'],
      ['javascript-skill-pass','python-skill-pass','sql-skill-pass','react-skill-pass','nodejs-skill-pass','git-skill-pass','data-structures-algorithms-skill-pass','html-css-skill-pass'],
      ['javascript-skill-pass-completion','python-skill-pass-completion','sql-skill-pass-completion','react-skill-pass-completion','nodejs-skill-pass-completion','git-skill-pass-completion','data-structures-algorithms-skill-pass-completion','html-css-skill-pass-completion']
    ]);
  Object.assign(check,catalogResult.rows[0]);
  const bundleResult = await client.query(`SELECT
    (SELECT COUNT(*)::int FROM products p JOIN product_prices pp ON pp.product_id=p.id
      WHERE p.slug LIKE '%-career-bundle' AND p.status='active' AND pp.currency='USD' AND pp.amount_minor=4999 AND pp.is_active=TRUE) AS prepared_bundle_count,
    (SELECT COUNT(*)::int FROM (SELECT ps.product_id FROM product_skills ps JOIN products p ON p.id=ps.product_id
      WHERE p.slug LIKE '%-career-bundle' GROUP BY ps.product_id HAVING COUNT(ps.skill_id)>=3) bundles) AS multi_skill_bundle_count,
    (SELECT COUNT(*)::int FROM (
      SELECT d.id FROM certificate_definitions d
      JOIN certificate_required_lessons rl ON rl.definition_id=d.id
      JOIN certificate_required_quizzes rq ON rq.definition_id=d.id
      JOIN certificate_required_projects rp ON rp.definition_id=d.id
      WHERE d.slug LIKE '%-career-completion' AND d.is_active=TRUE
      GROUP BY d.id HAVING COUNT(DISTINCT rl.lesson_id)>=36 AND COUNT(DISTINCT rq.quiz_id)>=3 AND COUNT(DISTINCT rp.project_id)>=3
    ) certificates) AS prepared_bundle_certificate_count,
    (SELECT COUNT(*)::int FROM (
      SELECT p.id FROM products p JOIN premium_content_rules r ON r.product_id=p.id
      WHERE p.slug LIKE '%-career-bundle' GROUP BY p.id
      HAVING COUNT(*) FILTER(WHERE r.entity_type='course')>=3
        AND COUNT(*) FILTER(WHERE r.entity_type='quiz')>=3
        AND COUNT(*) FILTER(WHERE r.entity_type='project')>=3
        AND COUNT(*) FILTER(WHERE r.entity_type='certificate')=1
    ) protected) AS protected_bundle_count,
    (SELECT COUNT(*)::int FROM careers c WHERE NOT EXISTS(
      SELECT 1 FROM career_projects cp JOIN projects p ON p.id=cp.project_id
      WHERE cp.career_id=c.id AND p.is_active=TRUE)) AS careers_without_projects,
    (SELECT COUNT(*)::int FROM projects WHERE slug=ANY($1::text[]) AND is_active=TRUE) AS new_career_project_count`,[[
      'multi-channel-content-campaign','lifecycle-email-campaign','performance-campaign-optimization','consultative-sales-pipeline'
    ]]);
  Object.assign(check,bundleResult.rows[0]);
  if (!check.latest_migration) throw new Error("Migration 045_monthly_subscription.sql is not applied.");
  if (check.migration_count < 45) throw new Error(`Expected at least 45 migrations; found ${check.migration_count}.`);
  if (check.pkr_skill_pass_count < 8 || check.pkr_career_bundle_count < 5 || !check.monthly_subscription_ready) throw new Error("The PKR Skill Pass, Career Bundle, or monthly subscription pricing is incomplete.");
  if (check.skill_count < 49) throw new Error(`Expected at least 49 skills; found ${check.skill_count}.`);
  if (check.published_course_count < 8) throw new Error(`Expected at least 8 published starter courses; found ${check.published_course_count}.`);
  if (check.attributed_lesson_count < 8) throw new Error(`Expected at least 8 source-attributed lessons; found ${check.attributed_lesson_count}.`);
  if (check.published_assessment_count < 8) throw new Error(`Expected at least 8 published assessments with questions; found ${check.published_assessment_count}.`);
  if (check.react_lesson_count < 11) throw new Error(`Expected at least 11 React Skill Pass lessons; found ${check.react_lesson_count}.`);
  if (check.react_question_count < 12) throw new Error(`Expected at least 12 published React questions; found ${check.react_question_count}.`);
  if (!check.react_product_active || !check.react_price_ready || !check.react_certificate_ready) throw new Error("React Skill Pass product, price, or certificate is not prepared.");
  if (check.react_required_projects < 2) throw new Error(`Expected two React certificate projects; found ${check.react_required_projects}.`);
  if (check.react_premium_rules < 5) throw new Error(`Expected React premium access rules; found ${check.react_premium_rules}.`);
  if (check.complete_track_count < 8) throw new Error(`Expected eight complete Skill Pass courses; found ${check.complete_track_count}.`);
  if (check.complete_assessment_count < 8) throw new Error(`Expected eight complete Skill Pass assessments; found ${check.complete_assessment_count}.`);
  if (check.prepared_product_count < 8) throw new Error(`Expected eight prepared Skill Pass products and prices; found ${check.prepared_product_count}.`);
  if (check.prepared_certificate_count < 8) throw new Error(`Expected eight Skill Pass certificates with two projects; found ${check.prepared_certificate_count}.`);
  if (check.protected_product_count < 8) throw new Error(`Expected eight fully protected Skill Pass products; found ${check.protected_product_count}.`);
  if (check.linked_lesson_count < 96) throw new Error(`Expected a learning-resource link for all 96 Skill Pass lessons; found ${check.linked_lesson_count}.`);
  if (check.prepared_bundle_count < 5) throw new Error(`Expected five active $49.99 Career Bundles; found ${check.prepared_bundle_count}.`);
  if (check.multi_skill_bundle_count < 5) throw new Error(`Expected five multi-skill Career Bundles; found ${check.multi_skill_bundle_count}.`);
  if (check.prepared_bundle_certificate_count < 5) throw new Error(`Expected five complete career certificate definitions; found ${check.prepared_bundle_certificate_count}.`);
  if (check.protected_bundle_count < 5) throw new Error(`Expected five Career Bundles with course, quiz, project, and certificate rules; found ${check.protected_bundle_count}.`);
  if (check.careers_without_projects) throw new Error(`Expected every career to have an active project; ${check.careers_without_projects} have none.`);
  if (check.new_career_project_count < 4) throw new Error(`Expected four new career projects; found ${check.new_career_project_count}.`);
  if (check.duplicate_skills) throw new Error(`Found ${check.duplicate_skills} duplicate skill names.`);
  console.log(JSON.stringify({ status: "ok", ...check }));
} finally { await client.end().catch(() => {}); }
