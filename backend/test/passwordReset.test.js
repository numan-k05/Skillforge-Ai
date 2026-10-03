import { after, before, test, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.SMTP_HOST = "";
const { pool } = await import("../src/config/db.js");
const { resetPassword, requestPasswordReset } = await import("../src/services/authService.js");
const otpHash = await bcrypt.hash("123456", 4);
let calls;
let canConsume = true;
let failUpdate = false;
let released = false;
let updatedHash;

async function query(sql, params) {
  const text = sql.replace(/\s+/g, " ").trim();
  calls.push(text);
  if (text.includes("FROM password_reset_otps AS resets")) return { rows: [{ id: "7", user_id: "1", otp_hash: otpHash, attempts: 0 }] };
  if (text.includes("SET used_at = now()")) {
    assert.match(text, /used_at IS NULL AND expires_at > now\(\) AND attempts < 5/);
    return { rows: canConsume ? [{ user_id: "1" }] : [] };
  }
  if (text.includes("SET password_hash")) {
    if (failUpdate) throw new Error("write failed");
    updatedHash = params[1];
  }
  if (text.includes("FROM users")) return { rows: params[0] === "known@example.com" ? [{ id: "1", email: params[0] }] : [] };
  return { rows: [] };
}
before(() => {
  mock.method(pool, "query", query);
  mock.method(pool, "connect", async () => ({ query, release() { released = true; } }));
});
after(async () => { mock.restoreAll(); await pool.end(); });
const fields = { email: "known@example.com", otp: "123456", password: "new-password" };

test("password reset commits password and code consumption together", async () => {
  calls = []; released = false;
  await resetPassword(fields);
  assert.ok(await bcrypt.compare(fields.password, updatedHash));
  assert.equal(calls.at(-1), "COMMIT");
  assert.ok(released);
});

test("failed password update rolls back code consumption and releases the client", async () => {
  calls = []; released = false; failUpdate = true;
  try {
    await assert.rejects(resetPassword(fields), /write failed/);
    assert.equal(calls.at(-1), "ROLLBACK");
    assert.ok(released);
  } finally { failUpdate = false; }
});

test("a consumed or expired code cannot change the password", async () => {
  calls = []; canConsume = false;
  try {
    await assert.rejects(resetPassword(fields), (error) => error.statusCode === 400);
    assert.ok(!calls.some((sql) => sql.includes("SET password_hash")));
    assert.equal(calls.at(-1), "ROLLBACK");
  } finally { canConsume = true; }
});

test("SMTP failure does not reveal account existence and removes the undelivered code", async () => {
  calls = [];
  const logger = mock.method(console, "error", () => {});
  try {
    assert.equal(await requestPasswordReset({ email: "known@example.com" }), undefined);
    assert.equal(await requestPasswordReset({ email: "unknown@example.com" }), undefined);
    assert.ok(calls.some((sql) => sql.startsWith("DELETE FROM password_reset_otps")));
  } finally { logger.mock.restore(); }
});
