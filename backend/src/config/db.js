import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

function databaseConnectionString(value) {
  if (!env.isProduction || !value) return value;
  const url = new URL(value);
  // TLS is configured explicitly below. Leaving libpq's sslmode in the URL
  // makes pg parse two competing TLS configurations and emit a warning on
  // every serverless cold start.
  url.searchParams.delete("sslmode");
  return url.toString();
}

export const pool = new Pool({
  max: env.databasePoolMax,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  allowExitOnIdle: true,
  connectionString: databaseConnectionString(env.databaseUrl),
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
