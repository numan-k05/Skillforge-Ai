// Phase 5A: reads from the normalized `careers` / `career_skills` tables
// instead of the flat Phase 4A `career_skill_requirements`. Function
// names/shapes for `listSupportedCareers` and `getRequirementsForCareer`
// are kept the same as Phase 4A on purpose — they're consumed by
// `skillAnalysisService.js`'s skill-gap engine, which doesn't need to
// change at all for the career expansion to work.
import { pool } from "../config/db.js";

/** Every active career's canonical title — same shape Phase 4A returned. */
export async function listSupportedCareers() {
  const result = await pool.query(
    `SELECT title FROM careers WHERE is_active = TRUE ORDER BY title`
  );
  return result.rows.map((row) => row.title);
}

/**
 * A career's skill requirements, in the same row shape Phase 4A's
 * `career_skill_requirements` query returned (`required_level`,
 * `importance`, `skill_id`, `skill_name`, `skill_category`) so the
 * skill-gap engine needs no changes. `required_level` now comes from
 * `career_skills.target_level` (the level a student should reach to be
 * considered ready) and only 'required'/'recommended' rows are
 * included — 'optional' skills don't count against readiness.
 */
export async function getRequirementsForCareer(careerTitle) {
  const result = await pool.query(
    `SELECT
        cs.target_level AS required_level, cs.importance,
        s.id AS skill_id, s.name AS skill_name, s.category AS skill_category
     FROM career_skills cs
     JOIN careers c ON c.id = cs.career_id
     JOIN skills s ON s.id = cs.skill_id
     WHERE c.title = $1 AND cs.skill_type IN ('required', 'recommended')
     ORDER BY cs.importance DESC, s.name`,
    [careerTitle]
  );
  return result.rows;
}

/**
 * Full skill breakdown for a career (used by GET /api/careers/:id/skills):
 * every required/recommended/optional skill with its full requirement
 * metadata, plus the skill's own category/type/difficulty.
 */
export async function getCareerSkillsDetailed(careerId) {
  const result = await pool.query(
    `SELECT
        cs.id, cs.skill_type, cs.min_level, cs.target_level, cs.importance, cs.priority,
        s.id AS skill_id, s.name AS skill_name, s.description AS skill_description,
        s.category AS skill_category, s.skill_type AS skill_kind, s.difficulty,
        sc.name AS skill_category_name
     FROM career_skills cs
     JOIN skills s ON s.id = cs.skill_id
     LEFT JOIN skill_categories sc ON sc.id = s.skill_category_id
     WHERE cs.career_id = $1
     ORDER BY
       CASE cs.skill_type WHEN 'required' THEN 0 WHEN 'recommended' THEN 1 ELSE 2 END,
       cs.priority DESC, s.name`,
    [careerId]
  );
  return result.rows;
}

export default { listSupportedCareers, getRequirementsForCareer, getCareerSkillsDetailed };
