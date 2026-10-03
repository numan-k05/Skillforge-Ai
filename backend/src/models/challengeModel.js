import { pool } from "../config/db.js";

const COLUMNS = `c.id, c.title, c.slug, c.description, c.instructions, c.difficulty,
  c.category, c.language, c.starter_code, c.examples, c.hints, c.estimated_minutes,
  c.is_active, c.created_at, c.updated_at`;

export async function listChallenges({ difficulty, skillId, category } = {}) {
  const params = []; const conditions = ["c.is_active = TRUE"]; let joins = "";
  if (skillId) { params.push(skillId); joins += ` JOIN challenge_skills cs_filter ON cs_filter.challenge_id = c.id AND cs_filter.skill_id = $${params.length}`; }
  if (difficulty) { params.push(difficulty); conditions.push(`c.difficulty = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`c.category = $${params.length}`); }
  const result = await pool.query(`SELECT DISTINCT ${COLUMNS} FROM coding_challenges c ${joins} WHERE ${conditions.join(" AND ")} ORDER BY c.difficulty, c.title`, params);
  return result.rows;
}

export async function getChallengeById(id) {
  const result = await pool.query(`SELECT ${COLUMNS} FROM coding_challenges c WHERE c.id = $1 AND c.is_active = TRUE`, [id]);
  return result.rows[0] || null;
}

export async function getChallengeSkills(id) {
  const result = await pool.query(`SELECT cs.skill_id, s.name, s.category, cs.importance FROM challenge_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.challenge_id = $1 ORDER BY cs.importance DESC, s.name`, [id]);
  return result.rows;
}

export async function getUserProgress(userId, challengeId) {
  const result = await pool.query(`SELECT status, attempts_count, completed_at, updated_at FROM user_challenge_progress WHERE user_id = $1 AND challenge_id = $2`, [userId, challengeId]);
  return result.rows[0] || null;
}

export async function listUserProgress(userId) {
  const result = await pool.query(`SELECT challenge_id, status, attempts_count, completed_at, updated_at FROM user_challenge_progress WHERE user_id = $1 ORDER BY updated_at DESC`, [userId]);
  return result.rows;
}

export async function recordAttempt(userId, challengeId, answer, isCorrect) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO user_challenge_attempts (user_id, challenge_id, answer, is_correct) VALUES ($1,$2,$3,$4)`, [userId, challengeId, answer, isCorrect]);
    const status = isCorrect ? "completed" : "in_progress";
    const result = await client.query(`INSERT INTO user_challenge_progress (user_id, challenge_id, status, attempts_count, completed_at) VALUES ($1,$2,$3,1,${isCorrect ? "now()" : "NULL"}) ON CONFLICT (user_id, challenge_id) DO UPDATE SET status = CASE WHEN user_challenge_progress.status = 'completed' THEN 'completed' ELSE EXCLUDED.status END, attempts_count = user_challenge_progress.attempts_count + 1, completed_at = CASE WHEN $3 = 'completed' THEN now() ELSE user_challenge_progress.completed_at END, updated_at = now() RETURNING status, attempts_count, completed_at, updated_at`, [userId, challengeId, status]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export default { listChallenges, getChallengeById, getChallengeSkills, getUserProgress, listUserProgress, recordAttempt };
