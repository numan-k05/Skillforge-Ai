import { pool } from "../config/db.js";

export async function getLatestSnapshot(userId) {
  const result = await pool.query(`SELECT id, career_title, score, summary, measured_at FROM career_readiness_snapshots WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 1`, [userId]);
  return result.rows[0] || null;
}

// Page refreshes do not create history: a row is added only when the score or
// selected career has actually changed.
export async function recordSnapshotIfChanged(userId, { careerTitle, score, summary }) {
  const latest = await getLatestSnapshot(userId);
  if (latest && latest.career_title === careerTitle && Number(latest.score) === Number(score)) return { snapshot: latest, created: false };
  const result = await pool.query(`INSERT INTO career_readiness_snapshots (user_id, career_title, score, summary) VALUES ($1, $2, $3, $4::jsonb) RETURNING id, career_title, score, summary, measured_at`, [userId, careerTitle, score, JSON.stringify(summary)]);
  return { snapshot: result.rows[0], created: true };
}

export async function getSnapshotHistory(userId, limit = 24) {
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const result = await pool.query(`SELECT id, career_title, score, summary, measured_at FROM career_readiness_snapshots WHERE user_id = $1 ORDER BY measured_at DESC LIMIT $2`, [userId, safeLimit]);
  return result.rows;
}

export default { getLatestSnapshot, recordSnapshotIfChanged, getSnapshotHistory };
