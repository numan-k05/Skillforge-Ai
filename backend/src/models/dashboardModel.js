import { pool } from "../config/db.js";

export async function getLearningFocus(userId) {
  const result = await pool.query(`
    SELECT ce.course_id,ce.status AS enrollment_status,ce.started_at,ce.completed_at,
      c.title,c.slug,c.description,c.difficulty,c.estimated_hours,c.skill_id,s.name AS skill_name,
      (SELECT COUNT(*)::int FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id
        WHERE cm.course_id=c.id AND cl.is_active=TRUE) AS lesson_count,
      (SELECT COUNT(*)::int FROM lesson_progress lp JOIN course_lessons cl ON cl.id=lp.lesson_id
        JOIN course_modules cm ON cm.id=cl.module_id
        WHERE lp.user_id=ce.user_id AND cm.course_id=c.id AND cl.is_active=TRUE) AS completed_lessons,
      COALESCE((SELECT json_agg(item ORDER BY item.title) FROM (
        SELECT DISTINCT q.id,q.title,qv.pass_percent,
          (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_version_id=qv.id) AS question_count
        FROM quizzes q JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.status='published'
        WHERE q.course_id=c.id
      ) item),'[]'::json) AS assessments,
      COALESCE((SELECT json_agg(item ORDER BY item.title) FROM (
        SELECT DISTINCT p.id,p.title,p.slug,p.short_description,p.difficulty,p.estimated_hours
        FROM premium_content_rules course_rule
        JOIN premium_content_rules project_rule ON project_rule.product_id=course_rule.product_id AND project_rule.entity_type='project'
        JOIN projects p ON p.id=project_rule.entity_id AND p.is_active=TRUE
          AND EXISTS(SELECT 1 FROM project_skills ps WHERE ps.project_id=p.id AND ps.skill_id=c.skill_id)
        WHERE course_rule.entity_type='course' AND course_rule.entity_id=c.id
          AND (EXISTS(SELECT 1 FROM access_grants g WHERE g.product_id=course_rule.product_id AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()))
            OR EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL))
      ) item),'[]'::json) AS projects,
      COALESCE((SELECT json_agg(item ORDER BY item.importance DESC,item.title) FROM (
        SELECT career.id,career.title,career.slug,cc.name AS category,cs.importance
        FROM career_skills cs JOIN careers career ON career.id=cs.career_id AND career.is_active=TRUE
        JOIN career_categories cc ON cc.id=career.category_id
        WHERE cs.skill_id=c.skill_id ORDER BY cs.importance DESC,career.title LIMIT 4
      ) item),'[]'::json) AS careers,
      (SELECT json_build_object('id',d.id,'title',d.title,'slug',d.slug)
        FROM premium_content_rules course_rule
        JOIN premium_content_rules certificate_rule ON certificate_rule.product_id=course_rule.product_id AND certificate_rule.entity_type='certificate'
        JOIN certificate_definitions d ON d.id=certificate_rule.entity_id AND d.is_active=TRUE
        WHERE course_rule.entity_type='course' AND course_rule.entity_id=c.id
          AND (EXISTS(SELECT 1 FROM access_grants g WHERE g.product_id=course_rule.product_id AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()))
            OR EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL))
        ORDER BY d.id LIMIT 1) AS certificate
    FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id AND c.status='published'
    JOIN skills s ON s.id=c.skill_id
    WHERE ce.user_id=$1 AND (
      EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.role='admin' AND u.deleted_at IS NULL)
      OR NOT EXISTS(SELECT 1 FROM premium_content_rules r WHERE r.entity_type='course' AND r.entity_id=c.id)
      OR EXISTS(SELECT 1 FROM premium_content_rules r JOIN access_grants g ON g.product_id=r.product_id
        WHERE r.entity_type='course' AND r.entity_id=c.id AND g.user_id=$1 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()))
    )
    ORDER BY ce.updated_at DESC,ce.id DESC LIMIT 1
  `, [userId]);
  return result.rows[0] || null;
}

export async function getProjectProgress(userId) {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'paused')::int AS paused
    FROM user_projects
    WHERE user_id = $1
  `, [userId]);
  return result.rows[0];
}

export async function getChallengeProgress(userId) {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS started,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
      COALESCE(SUM(attempts_count), 0)::int AS attempts
    FROM user_challenge_progress
    WHERE user_id = $1
  `, [userId]);
  return result.rows[0];
}

export async function getTodayMissionProgress(userId, missionDate) {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped,
      COALESCE(SUM(estimated_minutes), 0)::int AS total_minutes,
      COALESCE(SUM(estimated_minutes) FILTER (WHERE status = 'completed'), 0)::int AS completed_minutes
    FROM daily_missions
    WHERE user_id = $1 AND mission_date = $2
  `, [userId, missionDate]);
  return result.rows[0];
}

export async function getActiveRoadmapProgress(userId) {
  const result = await pool.query(`
    SELECT
      r.id,
      r.career_title,
      r.target_weeks,
      r.weekly_hours,
      r.version,
      COUNT(ri.id)::int AS total_items,
      COUNT(ri.id) FILTER (WHERE ri.status = 'completed')::int AS completed_items,
      COUNT(DISTINCT rp.id)::int AS phase_count
    FROM roadmaps r
    LEFT JOIN roadmap_phases rp ON rp.roadmap_id = r.id
    LEFT JOIN roadmap_items ri ON ri.phase_id = rp.id
    WHERE r.user_id = $1 AND r.status = 'active'
    GROUP BY r.id
    ORDER BY r.generated_at DESC
    LIMIT 1
  `, [userId]);
  return result.rows[0] || null;
}

export default {
  getLearningFocus,
  getProjectProgress,
  getChallengeProgress,
  getTodayMissionProgress,
  getActiveRoadmapProgress,
};
