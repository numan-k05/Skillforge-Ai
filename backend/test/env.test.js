import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const backendRoot = new URL("..", import.meta.url);
const validProductionEnv = {
  ...process.env,
  DOTENV_CONFIG_PATH: "test/does-not-exist.env",
  NODE_ENV: "production",
  JWT_SECRET: "production-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
  DATABASE_URL: "postgresql://user:password@db.example.com:5432/skillforge",
  CORS_ORIGIN: "https://skillforge.example.com",
  PUBLIC_APP_URL: "https://skillforge.example.com",
  OWNER_ADMIN_EMAIL: "owner@example.com",
};

function loadEnv(overrides = {}, removed = []) {
  const env = { ...validProductionEnv, ...overrides };
  for (const name of removed) delete env[name];
  return spawnSync(process.execPath, ["--input-type=module", "--eval", "import('./src/config/env.js')"], {
    cwd: backendRoot,
    env,
    encoding: "utf8",
  });
}

test("production environment accepts explicit secure deployment settings", () => {
  const result = loadEnv();
  assert.equal(result.status, 0, result.stderr);
});

test("production environment rejects missing database and owner configuration", () => {
  const database = loadEnv({}, ["DATABASE_URL"]);
  assert.notEqual(database.status, 0);
  assert.match(database.stderr, /DATABASE_URL must be a PostgreSQL connection URL/);

  const owner = loadEnv({}, ["OWNER_ADMIN_EMAIL"]);
  assert.notEqual(owner.status, 0);
  assert.match(owner.stderr, /OWNER_ADMIN_EMAIL must be a valid email address/);
});

test("production environment rejects insecure or malformed public origins", () => {
  const insecureCors = loadEnv({ CORS_ORIGIN: "http://skillforge.example.com" });
  assert.notEqual(insecureCors.status, 0);
  assert.match(insecureCors.stderr, /CORS_ORIGIN must use HTTPS/);

  const appUrlWithPath = loadEnv({ PUBLIC_APP_URL: "https://skillforge.example.com/app" });
  assert.notEqual(appUrlWithPath.status, 0);
  assert.match(appUrlWithPath.stderr, /PUBLIC_APP_URL must be an origin/);
});
