import { pool } from "../config/db.js";

export async function replacePasswordReset({ userId, otpHash, expiresAt }) {
  await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1", [userId]);
  await pool.query(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, otpHash, expiresAt]
  );
}

export async function getActivePasswordResetByEmail(email) {
  const result = await pool.query(
    `SELECT resets.id, resets.user_id, resets.otp_hash, resets.expires_at, resets.attempts
     FROM password_reset_otps AS resets
     INNER JOIN users ON users.id = resets.user_id
     WHERE users.email = $1
       AND resets.used_at IS NULL
       AND resets.expires_at > now()
     ORDER BY resets.created_at DESC
     LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function recordFailedPasswordResetAttempt(id) {
  await pool.query(
    `UPDATE password_reset_otps
     SET attempts = attempts + 1
     WHERE id = $1`,
    [id]
  );
}

export async function consumePasswordReset(id, client = pool) {
  const result = await client.query(
    `UPDATE password_reset_otps
     SET used_at = now()
     WHERE id = $1 AND used_at IS NULL AND expires_at > now() AND attempts < 5
     RETURNING user_id`,
    [id]
  );
  return result.rows[0] || null;
}

export async function deletePasswordResetsForUser(userId, client = pool) {
  await client.query("DELETE FROM password_reset_otps WHERE user_id = $1", [userId]);
}
