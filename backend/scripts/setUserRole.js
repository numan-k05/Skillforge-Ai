import { pool } from "../src/config/db.js";

const [, , rawEmail, role, confirmation] = process.argv;
const email = rawEmail?.trim().toLowerCase();
const allowed = new Set(["learner", "content_admin", "admin"]);
if (!email || !/^\S+@\S+\.\S+$/.test(email) || !allowed.has(role) || confirmation !== "--confirm") {
  console.error("Usage: npm run admin:set-role -- user@example.com content_admin --confirm");
  process.exitCode = 1;
} else {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query("SELECT id,email,role FROM users WHERE email=$1 FOR UPDATE", [email]);
    if (!current.rows[0]) throw new Error("No user exists with that email address.");
    if (current.rows[0].role === "admin" && role !== "admin") {
      const count = await client.query("SELECT count(*)::int AS value FROM users WHERE role='admin'");
      if (count.rows[0].value <= 1) throw new Error("The last administrator cannot be demoted.");
    }
    const result = await client.query("UPDATE users SET role=$2 WHERE email=$1 RETURNING id,email,role", [email, role]);
    if (!result.rows[0]) throw new Error("No user exists with that email address.");
    await client.query("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES(NULL,'role.bootstrap','user',$1,$2::jsonb)", [result.rows[0].id, JSON.stringify({ role })]);
    await client.query("COMMIT");
    console.log(`Updated ${result.rows[0].email} to ${result.rows[0].role}.`);
  } catch (error) {
    await client.query("ROLLBACK"); console.error(error.message); process.exitCode = 1;
  } finally { client.release(); await pool.end(); }
}
