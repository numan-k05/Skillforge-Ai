import test, { mock } from "node:test";
import assert from "node:assert/strict";

process.env.DOTENV_CONFIG_PATH = "test/does-not-exist.env";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.AI_API_KEY = "test-assessment-key";
process.env.AI_ASSESSMENTS_ENABLED = "true";
process.env.AI_API_BASE_URL = "https://api.anthropic.test";
process.env.AI_MODEL = "assessment-test-model";

const { createAttemptQuestionSet } = await import("../src/services/assessmentGenerationService.js");

test("enabled assessment AI creates a validated fresh set through the server provider", async () => {
  const providerPayload = {
    questions: [{
      prompt: "Which Hook should store a counter value?",
      explanation: "useState owns component-local state that changes over time.",
      options: [
        { text: "useState", isCorrect: true },
        { text: "useEffect", isCorrect: false },
        { text: "useRef only", isCorrect: false },
        { text: "A CSS variable", isCorrect: false },
      ],
    }],
  };
  const network = mock.method(globalThis, "fetch", async (_url, request) => {
    assert.equal(request.headers["x-api-key"], "test-assessment-key");
    return {
      ok: true,
      json: async () => ({ content: [{ type: "text", text: JSON.stringify(providerPayload) }], model: "assessment-test-model" }),
    };
  });

  try {
    const templates = [{
      id: 10,
      prompt: "Which Hook stores local state?",
      explanation: "useState stores local state.",
      points: 1,
      options: [
        { id: 101, text: "useState", isCorrect: true },
        { id: 102, text: "useEffect", isCorrect: false },
        { id: 103, text: "fetch", isCorrect: false },
        { id: 104, text: "CSS", isCorrect: false },
      ],
    }];
    const result = await createAttemptQuestionSet({ title: "React", description: "React state" }, templates);
    assert.equal(result.mode, "ai");
    assert.equal(result.provider, "anthropic");
    assert.equal(result.model, "assessment-test-model");
    assert.deepEqual(result.questions[0].options.map((option) => option.id), [101, 102, 103, 104]);
    assert.equal(network.mock.callCount(), 1);
  } finally {
    network.mock.restore();
  }
});

