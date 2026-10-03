import { after, before, test, mock } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Never load local credentials or connect to the developer's database.
process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.TRUST_PROXY_HOPS = "0";
process.env.AI_API_KEY = "";
process.env.SANDBOX_PAYMENT_WEBHOOK_SECRET = "test-sandbox-webhook-secret-0123456789";
process.env.WALLET_ENCRYPTION_KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

const { pool } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const users = new Map();
const profiles = new Map();
const queries = [];
let failure;
let failProfile = false;
let transaction;
let server;
let base;
let token;

async function query(sql, params = []) {
  const text = sql.replace(/\s+/g, " ").trim();
  queries.push({ text, params });
  if (failure) throw failure;
  if (text === "BEGIN") transaction = { users: new Map(users), profiles: new Map(profiles) };
  else if (text === "ROLLBACK") {
    users.clear(); profiles.clear();
    for (const [k, v] of transaction.users) users.set(k, v);
    for (const [k, v] of transaction.profiles) profiles.set(k, v);
  } else if (text === "COMMIT") transaction = null;
  else if (text.startsWith("INSERT INTO users")) {
    const [name, email, password_hash] = params;
    if (users.has(email)) throw Object.assign(new Error("duplicate"), { code: "23505" });
    const user = { id: String(users.size + 1), name, email, password_hash };
    users.set(email, user);
    return { rows: [{ id: user.id, name, email }] };
  } else if (text.startsWith("INSERT INTO profiles")) {
    if (failProfile) throw Object.assign(new Error("missing profile table"), { code: "42P01" });
    const profile = { user_id: String(params[0]), onboarding_completed: false };
    profiles.set(String(params[0]), profile);
    return { rows: [profile] };
  } else if (text.includes("FROM users WHERE email = $1")) {
    return { rows: users.has(params[0]) ? [users.get(params[0])] : [] };
  } else if (text.includes("FROM users WHERE id = $1")) {
    return { rows: [...users.values()].filter((user) => user.id === String(params[0])) };
  } else if (text.includes("to_regclass('public.users')")) {
    return { rows: [{ users_ready: true, migrations_ready: true, current_schema: true }] };
  } else if (text.includes("FROM profiles p")) {
    return { rows: profiles.has(String(params[0])) ? [profiles.get(String(params[0]))] : [] };
  } else if (text.includes("FROM premium_content_rules")) {
    return { rows: [{ allowed: true }] };
  } else if (text.includes("FROM roadmaps") || text.startsWith("UPDATE roadmaps") || text.includes("FROM daily_missions") || text.startsWith("UPDATE daily_missions")) {
    if (text.startsWith("UPDATE daily_missions")) assert.match(text, /UPDATE daily_missions AS dm/);
    // User 2 owns fixture 99; user 1 must not be allowed to access it.
    assert.match(text, /user_id = \$\d/);
    assert.ok(params.includes("1"), "query must use the verified JWT subject");
    return { rows: [] };
  } else if (text.includes("FROM portfolio_profiles")) {
    if (text.includes("is_public = TRUE")) return { rows: [] };
    assert.match(text, /user_id = \$1/);
    return { rows: [{ id: "10", user_id: params[0] }] };
  } else if (text.includes("FROM user_projects") || text.includes("FROM user_skills")) {
    assert.match(text, /user_id = \$1/);
    assert.equal(params[0], "1");
    return { rows: [] };
  } else if (!["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) {
    throw new Error(`Unexpected SQL in isolated test: ${text}`);
  }
  return { rows: [] };
}

before(async () => {
  mock.method(pool, "query", query);
  mock.method(pool, "connect", async () => ({ query, release() {} }));
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  mock.restoreAll();
  await pool.end();
});

async function request(path, { method = "GET", body, headers = {}, auth = false, raw } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(raw !== undefined || body !== undefined ? { body: raw ?? JSON.stringify(body) } : {}),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
const fields = { name: "Test Student", email: " Student@Example.com ", password: "student-password", confirmPassword: "student-password" };

test("registration normalizes email, hashes the password, creates a profile, and returns safe fields", async () => {
  const result = await request("/auth/signup", { method: "POST", body: fields });
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body.user).sort(), ["email", "id", "isOwnerAdmin", "name", "onboardingCompleted"]);
  assert.equal(result.body.user.email, "student@example.com");
  assert.equal(result.body.user.onboardingCompleted, false);
  assert.ok(await bcrypt.compare(fields.password, users.get("student@example.com").password_hash));
  assert.equal(jwt.verify(result.body.token, process.env.JWT_SECRET).sub, "1");
  assert.ok(profiles.has("1"));
  token = result.body.token;
});

test("duplicate registration returns 409", async () => {
  assert.equal((await request("/auth/signup", { method: "POST", body: fields })).status, 409);
});

test("registration rejects invalid input, password mismatch, and bcrypt byte truncation", async () => {
  for (const changes of [{ email: "invalid" }, { confirmPassword: "different" }, { name: " " }, { password: "é".repeat(37), confirmPassword: "é".repeat(37) }]) {
    const result = await request("/auth/signup", { method: "POST", body: { ...fields, ...changes } });
    assert.equal(result.status, 400);
    assert.ok(Array.isArray(result.body.error.details));
  }
});

test("registration rolls back the user if creating its profile fails", async () => {
  failProfile = true;
  try {
    const result = await request("/auth/signup", { method: "POST", body: { ...fields, email: "rollback@example.com" } });
    assert.equal(result.status, 503);
    assert.equal(users.has("rollback@example.com"), false);
    assert.equal(queries.at(-1).text, "ROLLBACK");
  } finally { failProfile = false; }
});

test("login accepts valid credentials and rejects wrong passwords and unknown accounts equally", async () => {
  const ok = await request("/auth/login", { method: "POST", body: fields });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const wrong = await request("/auth/login", { method: "POST", body: { ...fields, password: "wrong" } });
  const missing = await request("/auth/login", { method: "POST", body: { ...fields, email: "unknown@example.com" } });
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.deepEqual(wrong.body, missing.body);
});

test("valid JWT accesses /me; missing, malformed, expired, altered and wrong-algorithm tokens fail", async () => {
  assert.equal((await request("/auth/me", { auth: true })).body.user.email, "student@example.com");
  const secret = process.env.JWT_SECRET;
  const invalid = ["", "Basic token", "Bearer broken", `Bearer ${token} extra`,
    `Bearer ${jwt.sign({ sub: "1", email: "a@b.com" }, secret, { expiresIn: -1 })}`,
    `Bearer ${jwt.sign({ sub: "1", email: "a@b.com" }, "another-secret", { expiresIn: "1h" })}`,
    `Bearer ${jwt.sign({ sub: "1", email: "a@b.com" }, secret, { algorithm: "HS384", expiresIn: "1h" })}`,
    `Bearer ${jwt.sign({ email: "a@b.com" }, secret, { expiresIn: "1h" })}`,
    `Bearer ${jwt.sign({ sub: "1", email: "a@b.com" }, secret)}`];
  for (const Authorization of invalid) assert.equal((await request("/auth/me", { headers: { Authorization } })).status, 401);
});

test("all private route families reject unauthenticated access before database work", async () => {
  const count = queries.length;
  for (const path of ["/profile", "/account/privacy", "/account/export", "/onboarding/status", "/onboarding/catalog", "/skills/me", "/skills/catalog", "/skill-analysis", "/roadmap", "/ai/status", "/projects/mine", "/projects/recommended", "/projects/1", "/missions/today", "/challenges", "/dashboard/overview", "/progress/overview", "/career-readiness/overview", "/evidence-readiness/overview", "/evidence-readiness/history", "/career-match", "/portfolios/me", "/learning-resources/recommended", "/courses/mine", "/assessments/history", "/assessments/attempts/1", "/certificates/catalog", "/certificates/mine", "/commerce/account", "/payments/orders/1/receipt"]) {
    assert.equal((await request(path)).status, 401, path);
  }
  assert.equal((await request("/portfolios/me/evidence",{method:"PUT",body:{entries:[]}})).status,401);
  for (const [method, path] of [["PUT", "/profile"], ["PUT", "/account/preferences"], ["POST", "/account/consents"], ["DELETE", "/account"], ["PUT", "/skills/me"], ["POST", "/onboarding/complete"], ["POST", "/roadmap/generate"], ["DELETE", "/roadmap/99"], ["POST", "/projects/99/start"], ["PATCH", "/missions/99/status"], ["POST", "/challenges/99/submit"], ["PUT", "/portfolios/me/content"], ["POST", "/assessments/1/attempts"], ["POST", "/assessments/attempts/1/submit"], ["POST", "/auth/logout"]]) {
    assert.equal((await request(path, { method, body: {} })).status, 401, path);
  }
  assert.equal(queries.length, count);
});

test("ownership guards reject another user's roadmap, mission, and portfolio selections", async () => {
  for (const [method, path, body] of [["GET", "/roadmap/99"], ["PATCH", "/roadmap/99/status", { status: "completed" }], ["DELETE", "/roadmap/99"], ["POST", "/roadmap/99/regenerate", {}], ["PATCH", "/missions/99/status", { status: "completed" }]]) {
    assert.equal((await request(path, { method, body, auth: true })).status, 404, path);
  }
  for (const body of [{ projectIds: [99] }, { skillIds: [99] }]) {
    assert.equal((await request("/portfolios/me/content", { method: "PUT", body, auth: true })).status, 400);
  }
  assert.equal((await request("/portfolios/public/private-user")).status, 404);
});

test("invalid ids, dates, filters and status values return 400", async () => {
  for (const path of ["/roadmap/nope", "/challenges/0", "/challenges?skillId=abc", "/challenges?difficulty=invalid", "/challenges/recommended?limit=0", "/missions/today?date=2026-02-31", "/missions/today?date=2026-01-01&date=2026-01-02", "/learning-resources/recommended?limit=999"]) {
    assert.equal((await request(path, { auth: true })).status, 400, path);
  }
  assert.equal((await request("/roadmap/99/status", { method: "PATCH", body: { status: "invalid" }, auth: true })).status, 400);
});

test("CORS allows configured origins and preflight, rejects others; errors stay JSON", async () => {
  const allowed = await request("/health", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(allowed.headers.get("cache-control"), "no-store");
  const ready = await request("/ready");
  assert.equal(ready.status, 200);
  assert.equal(ready.body.status, "ready");
  const preflight = await fetch(base + "/auth/login", { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" } });
  assert.equal(preflight.status, 204);
  const denied = await request("/health", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.equal((await request("/missing")).status, 404);
  const malformed = await request("/auth/login", { method: "POST", raw: "{" });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.message, "Request body must contain valid JSON.");
  assert.equal((await request("/auth/login", { method: "POST", raw: "x".repeat(1024 * 1024 + 1) })).status, 413);
});

test("unexpected and database errors do not leak internals", async () => {
  const logger = mock.method(console, "error", () => {});
  try {
    for (const [error, expected] of [[new Error("SECRET internal SQL"), 500], [Object.assign(new Error("SECRET connection string"), { code: "ECONNREFUSED" }), 503]]) {
      failure = error;
      const result = await request("/auth/me", { auth: true });
      assert.equal(result.status, expected);
      assert.doesNotMatch(JSON.stringify(result.body), /SECRET|stack|SELECT/);
    }
  } finally { failure = undefined; logger.mock.restore(); }
});

test("authentication and general API rate limits return structured 429 responses", async () => {
  let result;
  for (let i = 0; i < 21; i++) {
    result = await request("/auth/login", { method: "POST", body: {} });
    if (result.status === 429) break;
  }
  assert.equal(result.status, 429);
  assert.match(result.body.error.message, /Too many authentication/);
  for (let i = 0; i < 301; i++) {
    result = await request("/health");
    if (result.status === 429) break;
  }
  assert.equal(result.status, 429);
  assert.match(result.body.error.message, /Too many requests/);
  assert.ok(result.headers.get("retry-after"));
});
