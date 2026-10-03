import "dotenv/config";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const source = new URL(process.env.DATABASE_URL);
const databaseName = `skillforge_rehearsal_${crypto.randomBytes(6).toString("hex")}`;
const adminUrl = new URL(source); adminUrl.pathname = "/postgres";
const rehearsalUrl = new URL(source); rehearsalUrl.pathname = `/${databaseName}`;
const ssl = process.env.NODE_ENV === "production" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false;
const admin = new Client({ connectionString: adminUrl.toString(), ssl });

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", env: { ...process.env, NODE_ENV: "test", DATABASE_URL: rehearsalUrl.toString() } });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with code ${code}`)));
    child.on("error", reject);
  });
}

try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await run("scripts/setupDatabase.js");
  await run("scripts/verifyDatabase.js");
  console.log(`[db] Clean migration rehearsal passed (${databaseName}).`);
} finally {
  await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()", [databaseName]).catch(() => {});
  await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`).catch(() => {});
  await admin.end().catch(() => {});
}
