import { pool } from "../config/db.js";

const PROJECT_COLUMNS = `
  p.id, p.title, p.slug, p.short_description, p.description,
  p.difficulty, p.estimated_hours, p.project_type, p.is_active,
  p.created_at, p.updated_at
`;

export async function listProjects({ careerId, skillId, difficulty, activeOnly = true } = {}) {
  const conditions = [];
  const params = [];
  let joinSql = "";

  if (activeOnly) conditions.push("p.is_active = TRUE");
  if (careerId) {
    params.push(careerId);
    joinSql += ` JOIN career_projects cp_filter ON cp_filter.project_id = p.id AND cp_filter.career_id = $${params.length}`;
  }
  if (skillId) {
    params.push(skillId);
    joinSql += ` JOIN project_skills ps_filter ON ps_filter.project_id = p.id AND ps_filter.skill_id = $${params.length}`;
  }
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`p.difficulty = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT DISTINCT ${PROJECT_COLUMNS}
     FROM projects p
     ${joinSql}
     ${where}
     ORDER BY p.title`,
    params
  );
  return result.rows;
}

export async function getProjectById(projectId) {
  const result = await pool.query(
    `SELECT ${PROJECT_COLUMNS} FROM projects p WHERE p.id = $1`,
    [projectId]
  );
  return result.rows[0] || null;
}

export async function getProjectSkills(projectId) {
  const result = await pool.query(
    `SELECT ps.skill_id, s.name, s.category, s.description, ps.importance
     FROM project_skills ps
     JOIN skills s ON s.id = ps.skill_id
     WHERE ps.project_id = $1
     ORDER BY ps.importance DESC, s.name`,
    [projectId]
  );
  return result.rows;
}

export async function getProjectCareers(projectId) {
  const result = await pool.query(
    `SELECT c.id AS career_id, c.title, c.slug, cp.relevance
     FROM career_projects cp
     JOIN careers c ON c.id = cp.career_id
     WHERE cp.project_id = $1 AND c.is_active = TRUE
     ORDER BY cp.relevance DESC, c.title`,
    [projectId]
  );
  return result.rows;
}

export async function getProjectMilestones(projectId) {
  const result = await pool.query(
    `SELECT id, milestone_order, title, description, estimated_hours
     FROM project_milestones
     WHERE project_id = $1
     ORDER BY milestone_order`,
    [projectId]
  );
  return result.rows;
}

export async function getUserProject(userId, projectId) {
  const result = await pool.query(
    `SELECT id, user_id, project_id, status, started_at, completed_at, created_at, updated_at
     FROM user_projects WHERE user_id = $1 AND project_id = $2`,
    [userId, projectId]
  );
  return result.rows[0] || null;
}

export async function listUserProjects(userId) {
  const result = await pool.query(
    `SELECT up.id, up.project_id, up.status, up.started_at, up.completed_at,
            up.created_at, up.updated_at, p.title, p.slug, p.short_description,
            p.difficulty, p.estimated_hours, p.project_type
     FROM user_projects up
     JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1
     ORDER BY up.updated_at DESC, p.title`,
    [userId]
  );
  return result.rows;
}

export async function createUserProject(userId, projectId) {
  const result = await pool.query(
    `INSERT INTO user_projects (user_id, project_id, status)
     VALUES ($1, $2, 'not_started')
     ON CONFLICT (user_id, project_id) DO NOTHING
     RETURNING id, user_id, project_id, status, started_at, completed_at, created_at, updated_at`,
    [userId, projectId]
  );
  return result.rows[0] || (await getUserProject(userId, projectId));
}

export async function startOrGetUserProject(userId, projectId) {
  const result = await pool.query(
    `INSERT INTO user_projects (user_id, project_id, status, started_at)
     VALUES ($1, $2, 'in_progress', now())
     ON CONFLICT (user_id, project_id) DO UPDATE
       SET status = CASE
           WHEN user_projects.status IN ('completed', 'paused') THEN user_projects.status
           ELSE 'in_progress'
         END,
         started_at = COALESCE(user_projects.started_at, now())
     RETURNING id, user_id, project_id, status, started_at, completed_at, created_at, updated_at`,
    [userId, projectId]
  );
  return result.rows[0];
}

export async function updateUserProjectStatus(userId, projectId, status) {
  const completedAt = status === "completed" ? "now()" : "NULL";
  const result = await pool.query(
    `UPDATE user_projects
     SET status = $3,
         started_at = CASE WHEN $3 = 'in_progress' THEN COALESCE(started_at, now()) ELSE started_at END,
         completed_at = ${completedAt}
     WHERE user_id = $1 AND project_id = $2
     RETURNING id, user_id, project_id, status, started_at, completed_at, created_at, updated_at`,
    [userId, projectId, status]
  );
  return result.rows[0] || null;
}

export default {
  listProjects,
  getProjectById,
  getProjectSkills,
  getProjectCareers,
  getProjectMilestones,
  getUserProject,
  listUserProjects,
  createUserProject,
  startOrGetUserProject,
  updateUserProjectStatus,
};
