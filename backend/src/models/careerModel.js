import { pool } from "../config/db.js";

const CAREER_COLUMNS = `
  c.id, c.title, c.slug, c.short_description, c.is_active,
  c.category_id, cc.name AS category_name, cc.slug AS category_slug,
  c.created_at, c.updated_at
`;

/**
 * Full career catalog, optionally filtered to one category.
 * Inactive careers are excluded unless `includeInactive` is set (admin use).
 */
export async function listCareers({ categoryId, includeInactive = false } = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push(`c.is_active = TRUE`);
  }
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`c.category_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT ${CAREER_COLUMNS}
     FROM careers c
     JOIN career_categories cc ON cc.id = c.category_id
     ${where}
     ORDER BY cc.display_order, c.title`,
    params
  );
  return result.rows;
}

export async function getCareerById(id) {
  const result = await pool.query(
    `SELECT ${CAREER_COLUMNS}
     FROM careers c
     JOIN career_categories cc ON cc.id = c.category_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getCareerByTitle(title) {
  const result = await pool.query(
    `SELECT ${CAREER_COLUMNS}
     FROM careers c
     JOIN career_categories cc ON cc.id = c.category_id
     WHERE c.title = $1`,
    [title]
  );
  return result.rows[0] || null;
}

export default { listCareers, getCareerById, getCareerByTitle };
