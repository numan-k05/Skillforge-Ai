import { pool } from "../config/db.js";

export async function listSkillsCatalog() {
  const result = await pool.query(
    `SELECT id, name, category
     FROM skills
     ORDER BY category NULLS LAST, name`
  );
  return result.rows;
}

export async function getUserSkills(userId) {
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name, s.category, us.proficiency_level
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY s.name`,
    [userId]
  );
  return result.rows;
}

async function getOrCreateSkillId(client, name) {
  const existing = await client.query(`SELECT id FROM skills WHERE name = $1`, [name]);
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO skills (name, category)
     VALUES ($1, 'Custom')
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return inserted.rows[0].id;
}

/**
 * Replace a user's self-reported skill levels with the given list
 * (get-or-create each skill by name). Runs as its own transaction.
 */
export async function replaceUserSkills(userId, entries) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM user_skills WHERE user_id = $1`, [userId]);

    for (const { name, level } of entries) {
      const skillId = await getOrCreateSkillId(client, name);
      await client.query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level`,
        [userId, skillId, level]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default { listSkillsCatalog, getUserSkills, replaceUserSkills };
