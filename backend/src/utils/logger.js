import crypto from "node:crypto";

const REDACTED_KEYS = /password|token|secret|authorization|cookie|otp|destination|signature|ciphertext|email/i;

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, REDACTED_KEYS.test(key) ? "[REDACTED]" : redact(item)]));
}

export function writeLog(level, event, fields = {}) {
  const record = { timestamp: new Date().toISOString(), level, event, ...redact(fields) };
  const output = JSON.stringify(record);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  const requestId = req.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => writeLog("info", "http_request", {
    requestId, method: req.method, path: req.path, statusCode: res.statusCode,
    durationMs: Number(process.hrtime.bigint() - started) / 1e6,
  }));
  next();
}

export default { redact, writeLog, requestLogger };
