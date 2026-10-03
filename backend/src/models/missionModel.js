import { pool } from "../config/db.js";

const MISSION_COLUMNS = `
  dm.id, dm.user_id, dm.mission_date, dm.mission_order, dm.title,
  dm.description, dm.mission_type, dm.difficulty, dm.estimated_minutes,
  dm.skill_id, dm.project_id, dm.status, dm.completed_at,
  dm.created_at, dm.updated_at
`;

export async function getMissionsByDate(userId, missionDate) {
  const result = await pool.query(
    `SELECT ${MISSION_COLUMNS},
            s.name AS skill_name, s.category AS skill_category,
            p.title AS project_title, p.slug AS project_slug
     FROM daily_missions dm
     LEFT JOIN skills s ON s.id = dm.skill_id
     LEFT JOIN projects p ON p.id = dm.project_id
     WHERE dm.user_id = $1 AND dm.mission_date = $2
     ORDER BY dm.mission_order`,
    [userId, missionDate]
  );
  return result.rows;
}

export async function getMissionById(userId, missionId) {
  const result = await pool.query(
    `SELECT ${MISSION_COLUMNS},
            s.name AS skill_name, s.category AS skill_category,
            p.title AS project_title, p.slug AS project_slug
     FROM daily_missions dm
     LEFT JOIN skills s ON s.id = dm.skill_id
     LEFT JOIN projects p ON p.id = dm.project_id
     WHERE dm.user_id = $1 AND dm.id = $2`,
    [userId, missionId]
  );
  return result.rows[0] || null;
}

export async function createDailyMissions(userId, missionDate, missions) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT id FROM daily_missions WHERE user_id = $1 AND mission_date = $2 LIMIT 1`,
      [userId, missionDate]
    );
    if (existing.rows.length) {
      await client.query("COMMIT");
      return getMissionsByDate(userId, missionDate);
    }

    for (const mission of missions) {
      await client.query(
        `INSERT INTO daily_missions
          (user_id, mission_date, mission_order, title, description, mission_type,
           difficulty, estimated_minutes, skill_id, project_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [userId, missionDate, mission.order, mission.title, mission.description,
          mission.type, mission.difficulty, mission.estimatedMinutes,
          mission.skillId ?? null, mission.projectId ?? null]
      );
    }
    await client.query("COMMIT");
    return getMissionsByDate(userId, missionDate);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMissionStatus(userId, missionId, status) {
  const completedAt = status === "completed" ? "now()" : "NULL";
  const result = await pool.query(
    `UPDATE daily_missions AS dm
     SET status = $3,
         completed_at = ${completedAt}
     WHERE user_id = $1 AND id = $2
     RETURNING ${MISSION_COLUMNS}`,
    [userId, missionId, status]
  );
  return result.rows[0] || null;
}

export async function getMissionStats(userId, missionDate) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
            COALESCE(SUM(estimated_minutes),0)::int AS total_minutes,
            COALESCE(SUM(estimated_minutes) FILTER (WHERE status = 'completed'),0)::int AS completed_minutes
     FROM daily_missions
     WHERE user_id = $1 AND mission_date = $2`,
    [userId, missionDate]
  );
  return result.rows[0];
}

export default { getMissionsByDate, getMissionById, createDailyMissions, updateMissionStatus, getMissionStats };
