import { pool } from "../config/db.js";

const PROFILE_COLUMNS = `
  id, user_id, university, degree, semester, career_goal_id,
  country, weekly_hours_available, learning_goals,
  onboarding_completed, onboarding_completed_at,
  created_at, updated_at
`;

export async function createProfileForUser(userId, client = pool) {
  const result = await client.query(
    `INSERT INTO profiles (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING ${PROFILE_COLUMNS}`,
    [userId]
  );
  if (result.rows[0]) return result.rows[0];

  // Row already existed (e.g. re-created after a failed prior request) — fetch it.
  const existing = await client.query(`SELECT ${PROFILE_COLUMNS} FROM profiles WHERE user_id = $1`, [
    userId,
  ]);
  return existing.rows[0] || null;
}

export async function getProfileByUserId(userId) {
  const result = await pool.query(
    `SELECT
        p.id, p.user_id, p.university, p.degree, p.semester,
        p.country, p.weekly_hours_available, p.learning_goals,
        p.onboarding_completed, p.onboarding_completed_at,
        cg.title AS career_goal_title,
        p.created_at, p.updated_at
     FROM profiles p
     LEFT JOIN career_goals cg ON cg.id = p.career_goal_id
     WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Partial update: any field left `undefined` is left unchanged.
 * Pass `null` explicitly to clear a field.
 */
export async function updateProfileFields(
  userId,
  { university, degree, semester, careerGoalId, country, weeklyHoursAvailable, learningGoals }
) {
  const result = await pool.query(
    `UPDATE profiles
     SET university             = CASE WHEN $2::boolean  THEN $3  ELSE university END,
         degree                 = CASE WHEN $4::boolean  THEN $5  ELSE degree END,
         semester               = CASE WHEN $6::boolean  THEN $7  ELSE semester END,
         career_goal_id         = CASE WHEN $8::boolean  THEN $9  ELSE career_goal_id END,
         country                = CASE WHEN $10::boolean THEN $11 ELSE country END,
         weekly_hours_available = CASE WHEN $12::boolean THEN $13 ELSE weekly_hours_available END,
         learning_goals         = CASE WHEN $14::boolean THEN $15 ELSE learning_goals END
     WHERE user_id = $1
     RETURNING ${PROFILE_COLUMNS}`,
    [
      userId,
      university !== undefined,
      university ?? null,
      degree !== undefined,
      degree ?? null,
      semester !== undefined,
      semester ?? null,
      careerGoalId !== undefined,
      careerGoalId ?? null,
      country !== undefined,
      country ?? null,
      weeklyHoursAvailable !== undefined,
      weeklyHoursAvailable ?? null,
      learningGoals !== undefined,
      learningGoals ?? null,
    ]
  );
  return result.rows[0] || null;
}

export default { createProfileForUser, getProfileByUserId, updateProfileFields };
