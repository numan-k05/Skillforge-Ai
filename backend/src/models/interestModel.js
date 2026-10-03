import { pool } from "../config/db.js";

export async function listInterests() {
  const result = await pool.query(
    `SELECT id, name, category
     FROM interests
     ORDER BY category NULLS LAST, name`
  );
  return result.rows;
}

export async function getUserInterestNames(userId) {
  const result = await pool.query(
    `SELECT i.name
     FROM user_interests ui
     JOIN interests i ON i.id = ui.interest_id
     WHERE ui.user_id = $1
     ORDER BY i.name`,
    [userId]
  );
  return result.rows.map((row) => row.name);
}

async function getOrCreateInterestId(client, name) {
  const existing = await client.query(`SELECT id FROM interests WHERE name = $1`, [name]);
  if (existing.rows[0]) return existing.rows[0].id;

  // Anything typed in by a user that isn't already in the catalog is
  // filed under "Custom" — mirrors the get-or-create pattern used for
  // career goals.
  const inserted = await client.query(
    `INSERT INTO interests (name, category)
     VALUES ($1, 'Custom')
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return inserted.rows[0].id;
}

/**
 * Replace a user's interests with the given list of names (get-or-create
 * each one). Runs inside the caller's transaction — pass the transaction
 * client, not the pool.
 */
export async function replaceUserInterestsTx(client, userId, names) {
  await client.query(`DELETE FROM user_interests WHERE user_id = $1`, [userId]);

  for (const name of names) {
    const interestId = await getOrCreateInterestId(client, name);
    await client.query(
      `INSERT INTO user_interests (user_id, interest_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, interest_id) DO NOTHING`,
      [userId, interestId]
    );
  }
}

/**
 * Standalone version for callers outside an existing transaction —
 * opens and manages its own client/transaction.
 */
export async function replaceUserInterests(userId, names) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await replaceUserInterestsTx(client, userId, names);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default {
  listInterests,
  getUserInterestNames,
  replaceUserInterestsTx,
  replaceUserInterests,
};
