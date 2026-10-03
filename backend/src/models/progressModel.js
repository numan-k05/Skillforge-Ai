import { pool } from "../config/db.js";

const pct = (done, total) => (total ? Math.round((Number(done) / Number(total)) * 100) : 0);

export async function getRoadmapProgress(userId) {
  const result = await pool.query(`
    SELECT r.id, r.career_title, r.status, r.target_weeks, r.weekly_hours,
           COUNT(ri.id)::int AS total_items,
           COUNT(ri.id) FILTER (WHERE ri.status = 'completed')::int AS completed_items,
           COUNT(ri.id) FILTER (WHERE ri.status = 'in_progress')::int AS in_progress_items
    FROM roadmaps r
    LEFT JOIN roadmap_phases rp ON rp.roadmap_id = r.id
    LEFT JOIN roadmap_items ri ON ri.phase_id = rp.id
    WHERE r.user_id = $1
    GROUP BY r.id
    ORDER BY (r.status = 'active') DESC, r.generated_at DESC
  `, [userId]);
  return result.rows.map((r) => ({ ...r, completion: pct(r.completed_items, r.total_items) }));
}

export async function getProjectProgress(userId) {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COUNT(*) FILTER (WHERE status = 'paused')::int AS paused
    FROM user_projects WHERE user_id = $1
  `, [userId]);
  const row = result.rows[0];
  return { ...row, completion: pct(row.completed, row.total) };
}

export async function getMissionProgress(userId) {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped
    FROM daily_missions WHERE user_id = $1
  `, [userId]);
  const row = result.rows[0];
  return { ...row, completion: pct(row.completed, row.total) };
}

export async function getChallengeProgress(userId) {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS started,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COALESCE(SUM(attempts_count), 0)::int AS attempts
    FROM user_challenge_progress WHERE user_id = $1
  `, [userId]);
  return result.rows[0];
}

export async function getSkillProgress(userId) {
  const result = await pool.query(`
    SELECT s.id AS skill_id, s.name, s.category,
           us.proficiency_level,
           COUNT(pe.id)::int AS improvement_events,
           MAX(pe.occurred_at) AS last_improved_at
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    LEFT JOIN progress_events pe
      ON pe.user_id = us.user_id
     AND pe.entity_type = 'skill'
     AND pe.entity_id = us.skill_id
     AND pe.event_type = 'skill_level_increased'
    WHERE us.user_id = $1
    GROUP BY s.id, s.name, s.category, us.proficiency_level
    ORDER BY us.proficiency_level DESC, s.name
  `, [userId]);
  return result.rows;
}

export async function getProgressHistory(userId, limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const result = await pool.query(`
    SELECT id, event_type, entity_type, entity_id, metadata, occurred_at
    FROM progress_events
    WHERE user_id = $1
    ORDER BY occurred_at DESC
    LIMIT $2
  `, [userId, safeLimit]);
  return result.rows;
}

export async function getOverallProgress(userId) {
  const [roadmap, projects, missions, challenges, skills] = await Promise.all([
    getRoadmapProgress(userId), getProjectProgress(userId), getMissionProgress(userId),
    getChallengeProgress(userId), getSkillProgress(userId),
  ]);

  const activeRoadmap = roadmap.find((r) => r.status === "active") || null;
  const evidence = [
    activeRoadmap?.completion ?? 0,
    projects.completion,
    missions.completion,
  ];
  if (challenges.started > 0) {
    evidence.push(pct(challenges.completed, challenges.started));
  }
  if (skills.length > 0) {
    const skillScore = Math.round((skills.reduce((sum, s) => sum + Number(s.proficiency_level), 0) / (skills.length * 5)) * 100);
    evidence.push(skillScore);
  }

  const overall = evidence.length ? Math.round(evidence.reduce((a, b) => a + b, 0) / evidence.length) : 0;
  return { overall, components: { roadmap: activeRoadmap?.completion ?? 0, projects: projects.completion, missions: missions.completion, challenges: challenges.started ? pct(challenges.completed, challenges.started) : 0, skills: skills.length ? Math.round((skills.reduce((sum, s) => sum + Number(s.proficiency_level), 0) / (skills.length * 5)) * 100) : 0 } };
}

export default { getRoadmapProgress, getProjectProgress, getMissionProgress, getChallengeProgress, getSkillProgress, getProgressHistory, getOverallProgress };
