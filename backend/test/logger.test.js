import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { redact, writeLog } from "../src/utils/logger.js";

test("structured logging recursively redacts credentials and personal destinations", () => {
  assert.deepEqual(redact({ userId: 2, password: "secret", nested: { authorization: "Bearer x", destinationHint: "1234", safe: true } }),
    { userId: 2, password: "[REDACTED]", nested: { authorization: "[REDACTED]", destinationHint: "[REDACTED]", safe: true } });
});

test("structured log output is valid JSON without secret values", () => {
  const logger = mock.method(console, "error", () => {});
  try {
    writeLog("error", "test_failure", { requestId: "abc", token: "never-log-me" });
    const record = JSON.parse(logger.mock.calls[0].arguments[0]);
    assert.equal(record.event, "test_failure");
    assert.equal(record.token, "[REDACTED]");
  } finally { logger.mock.restore(); }
});
