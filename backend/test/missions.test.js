import test from "node:test";
import assert from "node:assert/strict";

// Keep this unit test isolated from local credentials and the database.
process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.CORS_ORIGIN = "http://localhost:5173";

const { buildMissions } = await import("../src/services/missionService.js");

test("active-project missions use the project foreign key and database duration field", () => {
  const missions = buildMissions({
    gaps: [],
    activeProject: {
      id: "91",
      project_id: "7",
      title: "Portfolio API",
      difficulty: "intermediate",
      estimated_hours: 20,
    },
  });

  assert.deepEqual(missions, [{
    type: "build",
    difficulty: "intermediate",
    estimatedMinutes: 40,
    projectId: "7",
    title: "Build: Portfolio API",
    description: "Spend one focused session advancing the next unfinished part of Portfolio API. Keep the change small enough to finish today.",
    order: 1,
  }]);
  assert.ok(Number.isInteger(missions[0].estimatedMinutes));
});
