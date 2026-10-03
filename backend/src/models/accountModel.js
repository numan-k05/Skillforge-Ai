import { pool } from "../config/db.js";

export async function getPreferences(userId, client = pool) {
  const result = await client.query(
    `INSERT INTO user_preferences (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING product_updates, learning_reminders, public_profile_visible, updated_at`,
    [userId]
  );
  return result.rows[0];
}

export async function updatePreferences(userId, values, client = pool) {
  const current = await getPreferences(userId, client);
  const result = await client.query(
    `UPDATE user_preferences SET
       product_updates = $2,
       learning_reminders = $3,
       public_profile_visible = $4
     WHERE user_id = $1
     RETURNING product_updates, learning_reminders, public_profile_visible, updated_at`,
    [userId, values.productUpdates ?? current.product_updates, values.learningReminders ?? current.learning_reminders,
      values.publicProfileVisible ?? current.public_profile_visible]
  );
  if (values.publicProfileVisible === false) {
    await client.query("UPDATE portfolio_profiles SET is_public = FALSE WHERE user_id = $1", [userId]);
  }
  return result.rows[0];
}

export async function recordConsent(userId, consent, client = pool) {
  const result = await client.query(
    `INSERT INTO consent_history (user_id, consent_type, document_version, granted)
     VALUES ($1, $2, $3, $4)
     RETURNING id, consent_type, document_version, granted, recorded_at`,
    [userId, consent.type, consent.documentVersion, consent.granted]
  );
  return result.rows[0];
}

export async function getConsentHistory(userId, client = pool) {
  const result = await client.query(
    `SELECT id, consent_type, document_version, granted, recorded_at
     FROM consent_history WHERE user_id = $1 ORDER BY recorded_at DESC, id DESC`, [userId]
  );
  return result.rows;
}

export async function getExportData(userId) {
  const result = await pool.query(
    `SELECT
       jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'role',u.role,'createdAt',u.created_at) AS account,
       COALESCE((SELECT to_jsonb(p) - 'id' - 'user_id' FROM profiles p WHERE p.user_id=u.id), '{}'::jsonb) AS profile,
       COALESCE((SELECT to_jsonb(up) - 'user_id' FROM user_preferences up WHERE up.user_id=u.id), '{}'::jsonb) AS preferences,
       COALESCE((SELECT jsonb_agg(to_jsonb(ch) - 'user_id' ORDER BY ch.recorded_at) FROM consent_history ch WHERE ch.user_id=u.id), '[]'::jsonb) AS consents,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('name',i.name) ORDER BY i.name) FROM user_interests ui JOIN interests i ON i.id=ui.interest_id WHERE ui.user_id=u.id), '[]'::jsonb) AS interests,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('skillId',us.skill_id,'name',s.name,'level',us.proficiency_level,'updatedAt',us.updated_at) ORDER BY s.name) FROM user_skills us JOIN skills s ON s.id=us.skill_id WHERE us.user_id=u.id), '[]'::jsonb) AS skills,
       COALESCE((SELECT jsonb_agg(to_jsonb(r) - 'user_id' ORDER BY r.created_at) FROM roadmaps r WHERE r.user_id=u.id), '[]'::jsonb) AS roadmaps,
       COALESCE((SELECT jsonb_agg(to_jsonb(ce) - 'user_id' ORDER BY ce.started_at) FROM course_enrollments ce WHERE ce.user_id=u.id), '[]'::jsonb) AS course_enrollments,
       COALESCE((SELECT jsonb_agg(to_jsonb(qa) - 'user_id' - 'question_snapshot' ORDER BY qa.started_at) FROM quiz_attempts qa WHERE qa.user_id=u.id), '[]'::jsonb) AS quiz_attempts,
       COALESCE((SELECT jsonb_agg(to_jsonb(upj) - 'user_id' ORDER BY upj.created_at) FROM user_projects upj WHERE upj.user_id=u.id), '[]'::jsonb) AS project_progress,
       COALESCE((SELECT jsonb_agg(to_jsonb(ps) - 'user_id' ORDER BY ps.created_at) FROM project_submissions ps WHERE ps.user_id=u.id), '[]'::jsonb) AS project_submissions,
       COALESCE((SELECT to_jsonb(pp) - 'user_id' FROM portfolio_profiles pp WHERE pp.user_id=u.id), '{}'::jsonb) AS portfolio,
       COALESCE((SELECT jsonb_agg(to_jsonb(ic) - 'user_id' ORDER BY ic.issued_at) FROM issued_certificates ic WHERE ic.user_id=u.id), '[]'::jsonb) AS certificates,
       COALESCE((SELECT jsonb_agg(to_jsonb(o) - 'user_id' ORDER BY o.created_at) FROM orders o WHERE o.user_id=u.id), '[]'::jsonb) AS orders,
       COALESCE((SELECT jsonb_agg(to_jsonb(wl) - 'user_id' ORDER BY wl.created_at) FROM wallet_ledger wl WHERE wl.user_id=u.id), '[]'::jsonb) AS wallet_ledger,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id',wr.id,'currency',wr.currency,'amountMinor',wr.amount_minor,'status',wr.status,'destinationHint',wr.destination_hint,'requestedAt',wr.requested_at,'reviewedAt',wr.reviewed_at,'paidAt',wr.paid_at) ORDER BY wr.requested_at) FROM withdrawal_requests wr WHERE wr.user_id=u.id), '[]'::jsonb) AS withdrawals,
       COALESCE((SELECT to_jsonb(rc) - 'user_id' FROM referral_codes rc WHERE rc.user_id=u.id), '{}'::jsonb) AS referral_code,
       COALESCE((SELECT jsonb_agg(to_jsonb(rr) - 'referrer_user_id' - 'referred_user_id' ORDER BY rr.created_at) FROM referral_rewards rr WHERE rr.referrer_user_id=u.id OR rr.referred_user_id=u.id), '[]'::jsonb) AS referral_rewards
     FROM users u WHERE u.id=$1 AND u.deleted_at IS NULL`, [userId]
  );
  return result.rows[0] || null;
}

export async function deleteAccount(userId, anonymizedPasswordHash) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query("SELECT id, role, deleted_at FROM users WHERE id=$1 FOR UPDATE", [userId]);
    const user = locked.rows[0];
    if (!user || user.deleted_at) { await client.query("ROLLBACK"); return null; }
    if (user.role === "admin") {
      const admins = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role='admin' AND deleted_at IS NULL");
      if (admins.rows[0].count <= 1) { await client.query("ROLLBACK"); return { blocked: "last_admin" }; }
    }
    const withdrawals = await client.query("SELECT 1 FROM withdrawal_requests WHERE user_id=$1 AND status IN ('pending','approved') LIMIT 1", [userId]);
    if (withdrawals.rows.length) { await client.query("ROLLBACK"); return { blocked: "withdrawal" }; }

    await client.query(`INSERT INTO account_deletion_records (user_id) VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET requested_at=now()`, [userId]);
    for (const table of [
      "password_reset_otps", "user_interests", "user_skills", "daily_missions", "progress_events",
      "career_readiness_snapshots", "lesson_progress", "course_enrollments", "quiz_attempts",
      "user_challenge_attempts", "user_challenge_progress", "user_projects", "roadmaps",
      "project_submissions", "portfolio_profiles", "profiles", "career_goals",
      "user_preferences"
    ]) await client.query(`DELETE FROM ${table} WHERE user_id=$1`, [userId]);
    await client.query(`DELETE FROM evidence_readiness_snapshots ers WHERE ers.user_id=$1
      AND NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.readiness_snapshot_id=ers.id)`, [userId]);
    await client.query("UPDATE audit_logs SET actor_user_id=NULL WHERE actor_user_id=$1", [userId]);
    await client.query("UPDATE referral_codes SET is_active=FALSE WHERE user_id=$1", [userId]);
    await client.query(
      `UPDATE users SET name='Deleted user', email='deleted+' || id || '@invalid.skillforge.local',
       password_hash=$2, role='learner', deleted_at=now() WHERE id=$1`, [userId, anonymizedPasswordHash]
    );
    await client.query("UPDATE account_deletion_records SET completed_at=now() WHERE user_id=$1", [userId]);
    await client.query("COMMIT");
    return { deleted: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export default { getPreferences, updatePreferences, recordConsent, getConsentHistory, getExportData, deleteAccount };
