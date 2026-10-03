// Phase 5A: read-side model for the universal skill catalog (public
// reference data), distinct from userSkillModel.js which handles a
// user's own self-assessed skills.
import { pool } from "../config/db.js";

const SKILL_COLUMNS = `
  s.id, s.name, s.category, s.description, s.skill_type, s.difficulty, s.is_active,
  s.skill_category_id, sc.name AS skill_category_name, sc.slug AS skill_category_slug
`;

export async function listSkills({ skillCategoryId, activeOnly = true } = {}) {
  const conditions = [];
  const params = [];

  if (activeOnly) conditions.push(`s.is_active = TRUE`);
  if (skillCategoryId) {
    params.push(skillCategoryId);
    conditions.push(`s.skill_category_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT ${SKILL_COLUMNS}
     FROM skills s
     LEFT JOIN skill_categories sc ON sc.id = s.skill_category_id
     ${where}
     ORDER BY s.name`,
    params
  );
  return result.rows;
}

export async function getSkillById(id) {
  const result = await pool.query(
    `SELECT ${SKILL_COLUMNS}
     FROM skills s
     LEFT JOIN skill_categories sc ON sc.id = s.skill_category_id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export default { listSkills, getSkillById };
