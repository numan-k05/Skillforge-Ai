import { pool } from "../config/db.js";

function buildFilters(skillIds, { difficulty, free } = {}) {
  const values = [skillIds];
  const clauses = ["lr.is_active = TRUE", "lr.skill_id = ANY($1::bigint[])"];
  if (difficulty) {
    values.push(difficulty);
    clauses.push(`lr.difficulty = $${values.length}`);
  }
  if (free !== undefined) {
    values.push(free);
    clauses.push(`lr.is_free = $${values.length}`);
  }
  return { values, where: clauses.join(" AND ") };
}

const RESOURCE_COLUMNS = `
  lr.id, lr.skill_id, s.name AS skill_name, lr.title, lr.description,
  lr.provider, lr.resource_type, lr.url, lr.difficulty, lr.estimated_hours,
  lr.is_free, lr.is_active, lr.created_at, lr.updated_at
`;

export async function listResourcesForSkills(skillIds, filters = {}) {
  if (!skillIds.length) return [];
  const { values, where } = buildFilters(skillIds, filters);
  const result = await pool.query(
    `SELECT ${RESOURCE_COLUMNS}
     FROM learning_resources lr
     JOIN skills s ON s.id = lr.skill_id
     WHERE ${where}
     ORDER BY lr.is_free DESC, lr.estimated_hours NULLS LAST, lr.title
     LIMIT 200`,
    values
  );
  return result.rows;
}

export async function listResourcesForSkill(skillId, filters = {}) {
  const resources = await listResourcesForSkills([skillId], filters);
  return resources;
}

export async function countResourcesForSkill(skillId, filters = {}) {
  const { values, where } = buildFilters([skillId], filters);
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM learning_resources lr WHERE ${where}`, values);
  return result.rows[0].count;
}

export async function getSkillById(skillId) {
  const result = await pool.query("SELECT id, name FROM skills WHERE id = $1", [skillId]);
  return result.rows[0] || null;
}

export async function getRoadmapItemForUser(roadmapItemId, userId) {
  const result = await pool.query(
    `SELECT ri.id, ri.skill_id, ri.item_type, ri.title, ri.status,
            r.id AS roadmap_id, r.career_title, r.weekly_hours
     FROM roadmap_items ri
     JOIN roadmap_phases rp ON rp.id = ri.phase_id
     JOIN roadmaps r ON r.id = rp.roadmap_id
     WHERE ri.id = $1 AND r.user_id = $2`,
    [roadmapItemId, userId]
  );
  return result.rows[0] || null;
}

export default { listResourcesForSkills, listResourcesForSkill, countResourcesForSkill, getSkillById, getRoadmapItemForUser };
