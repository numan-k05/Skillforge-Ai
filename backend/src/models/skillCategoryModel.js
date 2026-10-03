import { pool } from "../config/db.js";

export async function listSkillCategories() {
  const result = await pool.query(
    `SELECT id, name, slug, description FROM skill_categories ORDER BY name`
  );
  return result.rows;
}

export default { listSkillCategories };
