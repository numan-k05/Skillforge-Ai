import { createHash } from "node:crypto";
import { pool } from "../config/db.js";

export async function getEvidence(userId) {
  const [courses, projects, quizzes, challenges, portfolio, activity] = await Promise.all([
    pool.query(`SELECT DISTINCT ce.course_id::text AS id, c.title FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=$1 AND ce.status='completed' ORDER BY ce.course_id::text`, [userId]),
    pool.query(`SELECT DISTINCT ps.id::text AS id, ps.project_id::text AS project_id, p.title FROM project_submissions ps JOIN projects p ON p.id=ps.project_id LEFT JOIN project_submission_revocations r ON r.submission_id=ps.id WHERE ps.user_id=$1 AND ps.status='approved' AND r.id IS NULL ORDER BY ps.id::text`, [userId]),
    pool.query(`SELECT DISTINCT qa.quiz_id::text AS id, q.title FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE qa.user_id=$1 AND qa.status='submitted' AND qa.passed=TRUE ORDER BY qa.quiz_id::text`, [userId]),
    pool.query(`SELECT DISTINCT ucp.challenge_id::text AS id, c.title FROM user_challenge_progress ucp JOIN coding_challenges c ON c.id=ucp.challenge_id WHERE ucp.user_id=$1 AND ucp.status='completed' ORDER BY ucp.challenge_id::text`, [userId]),
    pool.query(`SELECT pp.is_public, NULLIF(btrim(pp.biography),'') IS NOT NULL AS has_biography, EXISTS(SELECT 1 FROM portfolio_projects x WHERE x.portfolio_id=pp.id) AS has_project, EXISTS(SELECT 1 FROM portfolio_links x WHERE x.portfolio_id=pp.id) AS has_link FROM portfolio_profiles pp WHERE pp.user_id=$1`, [userId]),
    pool.query(`SELECT DISTINCT occurred_at::date::text AS day FROM progress_events WHERE user_id=$1 AND occurred_at >= now()-interval '28 days' ORDER BY day`, [userId]),
  ]);
  return { courses:courses.rows, projects:projects.rows, quizzes:quizzes.rows, challenges:challenges.rows, portfolio:portfolio.rows[0]||null, activeDays:activity.rows.map(row=>row.day) };
}

export function fingerprintEvidence(evidence) { return createHash("sha256").update(JSON.stringify(evidence)).digest("hex"); }
export async function recordSnapshotIfChanged(userId, snapshot) {
  const fingerprint=fingerprintEvidence(snapshot.evidence);
  const latest=await pool.query(`SELECT id,algorithm_version,score,band,components,evidence,evidence_fingerprint,measured_at FROM evidence_readiness_snapshots WHERE user_id=$1 ORDER BY measured_at DESC LIMIT 1`,[userId]);
  if(latest.rows[0]?.algorithm_version===snapshot.algorithmVersion&&latest.rows[0]?.evidence_fingerprint===fingerprint)return{snapshot:latest.rows[0],created:false};
  const result=await pool.query(`INSERT INTO evidence_readiness_snapshots(user_id,algorithm_version,score,band,components,evidence,evidence_fingerprint) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) RETURNING id,algorithm_version,score,band,components,evidence,evidence_fingerprint,measured_at`,[userId,snapshot.algorithmVersion,snapshot.score,snapshot.band,JSON.stringify(snapshot.components),JSON.stringify(snapshot.evidence),fingerprint]);
  return{snapshot:result.rows[0],created:true};
}
export async function history(userId,limit=24){const safe=Math.min(Math.max(Number(limit)||24,1),100);const r=await pool.query(`SELECT id,algorithm_version,score,band,components,evidence,measured_at FROM evidence_readiness_snapshots WHERE user_id=$1 ORDER BY measured_at DESC LIMIT $2`,[userId,safe]);return r.rows;}
export async function revokeSubmission(submissionId,userId,reason){const client=await pool.connect();try{await client.query("BEGIN");const found=await client.query(`SELECT id,status FROM project_submissions WHERE id=$1 FOR UPDATE`,[submissionId]);if(!found.rows[0]){await client.query("ROLLBACK");return null;}if(found.rows[0].status!=="approved"){await client.query("ROLLBACK");return{invalidStatus:found.rows[0].status};}const r=await client.query(`INSERT INTO project_submission_revocations(submission_id,revoked_by,reason) VALUES($1,$2,$3) ON CONFLICT(submission_id) DO UPDATE SET reason=project_submission_revocations.reason RETURNING id,submission_id,reason,revoked_at`,[submissionId,userId,reason]);await client.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,'project_evidence.revoked','project_submission',$2,$3::jsonb)`,[userId,submissionId,JSON.stringify({reason:r.rows[0].reason})]);await client.query("COMMIT");return r.rows[0];}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}}
export default{getEvidence,recordSnapshotIfChanged,history,revokeSubmission};
