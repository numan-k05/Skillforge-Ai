import app from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/db.js";

app.listen(env.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`SkillForge AI API listening on port ${env.port} [${env.nodeEnv}]`);

  // The server always starts, even if the database isn't reachable yet —
  // this keeps `npm run dev` usable while you finish configuring Postgres.
  // Auth/profile endpoints will return a clear 503 until DATABASE_URL is
  // correct and the schema has been applied.
  try {
    await checkDatabaseConnection();
    // eslint-disable-next-line no-console
    console.log("[db] Connected to PostgreSQL.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[db] Could not connect to PostgreSQL. Auth and profile routes will fail " +
        "until DATABASE_URL is set correctly and the schema in database/schema/ has been applied."
    );
    // eslint-disable-next-line no-console
    console.warn(`[db] ${err.message}`);
  }
});

export default app;
