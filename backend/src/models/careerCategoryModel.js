import { pool } from "../config/db.js";

export async function listCategories() {
  const result = await pool.query(
    `SELECT id, name, slug, description, display_order
     FROM career_categories
     ORDER BY display_order, name`
  );
  return result.rows;
}

export async function getCategoryById(id) {
  const result = await pool.query(
    `SELECT id, name, slug, description, display_order FROM career_categories WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export default { listCategories, getCategoryById };
