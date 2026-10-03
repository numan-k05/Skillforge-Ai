import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.resolve(__dirname, "../../database/schema");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[db] DATABASE_URL is missing. Create backend/.env first.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: ["1", "true", "yes", "on"].includes((process.env.DB_SSL_REJECT_UNAUTHORIZED ?? "true").trim().toLowerCase()) } : false,
});

async function main() {
  await client.connect();
  console.log("[db] Connected. Setting up SkillForge AI database...");

  await client.query(`
    CREATE TABLE IF NOT EXISTS skillforge_schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const entries = await fs.readdir(schemaDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^\d+.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const filename of files) {
    const { rows } = await client.query(
      "SELECT 1 FROM skillforge_schema_migrations WHERE filename = $1",
      [filename]
    );

    if (rows.length) {
      console.log(`[db] Already applied: ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(schemaDir, filename), "utf8");
    console.log(`[db] Applying: ${filename}`);
    await client.query(sql);
    await client.query(
      "INSERT INTO skillforge_schema_migrations (filename) VALUES ($1)",
      [filename]
    );
  }

  const authCheck = await client.query(`
    SELECT
      to_regclass('public.users') IS NOT NULL AS users_ready,
      to_regclass('public.profiles') IS NOT NULL AS profiles_ready
  `);
  const authReady = authCheck.rows[0].users_ready && authCheck.rows[0].profiles_ready;
  if (!authReady) {
    throw new Error("Database setup finished without the required auth tables (users/profiles).");
  }
  console.log("[db] Database setup complete. Auth tables are ready for signup/login.");
} 

main()
  .catch((error) => {
    console.error(`[db] Setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
