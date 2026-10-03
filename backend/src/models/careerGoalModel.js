import { pool } from "../config/db.js";

export async function findCareerGoalByTitle(userId, title) {
  const result = await pool.query(
    `SELECT id, user_id, title, description, created_at
     FROM career_goals
     WHERE user_id = $1 AND title = $2`,
    [userId, title]
  );
  return result.rows[0] || null;
}

export async function createCareerGoal(userId, title, description = null) {
  const result = await pool.query(
    `INSERT INTO career_goals (user_id, title, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, title) DO UPDATE SET title = EXCLUDED.title
     RETURNING id, user_id, title, description, created_at`,
    [userId, title, description]
  );
  return result.rows[0];
}

/**
 * Get-or-create a career goal by title, inside the caller's transaction
 * (pass the transaction client, not the pool). Returns the goal id.
 * Used by the onboarding flow, which needs the career-goal write in the
 * same transaction as the profile update.
 */
export async function getOrCreateCareerGoalIdTx(client, userId, title) {
  const existing = await client.query(
    `SELECT id FROM career_goals WHERE user_id = $1 AND title = $2`,
    [userId, title]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO career_goals (user_id, title)
     VALUES ($1, $2)
     ON CONFLICT (user_id, title) DO UPDATE SET title = EXCLUDED.title
     RETURNING id`,
    [userId, title]
  );
  return inserted.rows[0].id;
}

export default { findCareerGoalByTitle, createCareerGoal, getOrCreateCareerGoalIdTx };
