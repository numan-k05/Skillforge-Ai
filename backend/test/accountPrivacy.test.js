import { after, test, mock } from "node:test";
import assert from "node:assert/strict";

process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.CORS_ORIGIN = "http://localhost:5173";

const { pool } = await import("../src/config/db.js");
const accountModel = await import("../src/models/accountModel.js");
const { accountDeletionSchema, accountPreferencesSchema, consentSchema } = await import("../src/utils/validation.js");
after(async () => { mock.restoreAll(); await pool.end(); });

test("privacy inputs are explicit and bounded", () => {
  assert.equal(accountPreferencesSchema.safeParse({ publicProfileVisible: false }).success, true);
  assert.equal(accountPreferencesSchema.safeParse({}).success, false);
  assert.equal(consentSchema.safeParse({ type: "privacy", documentVersion: "2026-09-draft", granted: true }).success, true);
  assert.equal(consentSchema.safeParse({ type: "tracking", documentVersion: "v1", granted: true }).success, false);
  assert.equal(accountDeletionSchema.safeParse({ password: "current-password", confirmation: "DELETE" }).success, true);
  assert.equal(accountDeletionSchema.safeParse({ password: "current-password", confirmation: "delete" }).success, false);
});

test("account export selects useful records without authentication or payout secrets", async () => {
  let sql = "";
  mock.method(pool, "query", async (text) => { sql = text; return { rows: [{ account: { id: "1" }, orders: [] }] }; });
  const exported = await accountModel.getExportData("1");
  assert.equal(exported.account.id, "1");
  assert.doesNotMatch(sql, /password_hash|destination_ciphertext|destination_iv|destination_tag|webhook|signature/i);
  assert.match(sql, /to_jsonb\(qa\) - 'user_id' - 'question_snapshot'/);
  pool.query.mock.restore();
});

test("deletion anonymizes the login identity, clears personal tables, and retains audited records", async () => {
  const statements = [];
  async function query(sql) {
    const text = sql.replace(/\s+/g, " ").trim(); statements.push(text);
    if (text.startsWith("SELECT id, role, deleted_at")) return { rows: [{ id: "1", role: "learner", deleted_at: null }] };
    if (text.startsWith("SELECT 1 FROM withdrawal_requests")) return { rows: [] };
    return { rows: [] };
  }
  mock.method(pool, "connect", async () => ({ query, release() {} }));
  assert.deepEqual(await accountModel.deleteAccount("1", "replacement-hash"), { deleted: true });
  assert.ok(statements.some((sql) => sql.startsWith("UPDATE users SET name='Deleted user'")));
  assert.ok(statements.some((sql) => sql.startsWith("DELETE FROM portfolio_profiles")));
  assert.ok(statements.some((sql) => sql.startsWith("UPDATE referral_codes SET is_active=FALSE")));
  assert.equal(statements.some((sql) => /^DELETE FROM (orders|payments|issued_certificates|wallet_ledger)/.test(sql)), false);
  assert.equal(statements.at(-1), "COMMIT");
  pool.connect.mock.restore();
});
