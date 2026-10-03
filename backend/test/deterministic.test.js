import { test, mock } from "node:test";
import assert from "node:assert/strict";

process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.AI_API_KEY = "test-key-that-must-never-be-used";
const { isAIConfigured, getAIStatus, generateText } = await import("../src/services/aiService.js");

test("paid AI remains disabled even when a legacy environment key exists", async () => {
  const network = mock.method(globalThis, "fetch", () => { throw new Error("Paid provider call attempted"); });
  try {
    assert.equal(isAIConfigured(), false);
    assert.deepEqual(getAIStatus(), { configured: false, provider: "internal", model: null, mode: "deterministic" });
    const result = await generateText({ prompt: "test the legacy adapter" });
    assert.equal(result.fallback, true);
    assert.equal(network.mock.callCount(), 0);
  } finally { network.mock.restore(); }
});
