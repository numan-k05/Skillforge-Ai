import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  max: env.databasePoolMax,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  allowExitOnIdle: true,
  connectionString: env.databaseUrl,
  ssl: env.isProduction ? { rejectUnauthorized: env.dbSslRejectUnauthorized } : false,
});

pool.on("error", (err) => {
  // Errors on idle clients should never crash the process.
  // eslint-disable-next-line no-console
  console.error("[db] Unexpected error on idle PostgreSQL client:", err.message);
});

export async function checkDatabaseConnection() {
  await pool.query("SELECT 1");
}

export default pool;
