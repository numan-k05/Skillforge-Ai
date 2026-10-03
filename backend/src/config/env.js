import "dotenv/config";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32 || /^(dev-only|replace[_-]|change[_-])/i.test(jwtSecret)) {
  throw new Error("JWT_SECRET must be configured with a unique random value of at least 32 characters.");
}
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS must be a nonnegative integer.");
}
const apiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 1200);
if (!Number.isInteger(apiRateLimitMax) || apiRateLimitMax < 100) {
  throw new Error("API_RATE_LIMIT_MAX must be an integer of at least 100.");
}
const databasePoolMax = Number(process.env.DB_POOL_MAX || 5);
if (!Number.isInteger(databasePoolMax) || databasePoolMax < 1 || databasePoolMax > 20) {
  throw new Error("DB_POOL_MAX must be an integer between 1 and 20.");
}

function booleanEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function validateProductionUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS in production.`);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${name} must be an origin without a path, query, or fragment.`);
  }
}

if (nodeEnv === "production") {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL in production.");
  }
  if (!process.env.CORS_ORIGIN?.trim() || corsOrigins.length === 0) {
    throw new Error("CORS_ORIGIN must list the allowed frontend origin in production.");
  }
  for (const origin of corsOrigins) validateProductionUrl("CORS_ORIGIN", origin);

  const publicAppUrl = process.env.PUBLIC_APP_URL?.trim();
  if (!publicAppUrl) throw new Error("PUBLIC_APP_URL is required in production.");
  validateProductionUrl("PUBLIC_APP_URL", publicAppUrl);

  const ownerAdminEmail = process.env.OWNER_ADMIN_EMAIL?.trim();
  if (!ownerAdminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerAdminEmail)) {
    throw new Error("OWNER_ADMIN_EMAIL must be a valid email address in production.");
  }
}

export const env = {
  ownerAdminEmail: (process.env.OWNER_ADMIN_EMAIL || "").trim().toLowerCase(),
  nodeEnv,
  port: Number(process.env.PORT) || 4000,

  databaseUrl: required("DATABASE_URL"),
  databasePoolMax,

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: booleanEnv("SMTP_SECURE", false),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",

  aiApiKey: process.env.AI_API_KEY || "",
  aiApiBaseUrl: process.env.AI_API_BASE_URL || "https://api.anthropic.com",
  aiModel: process.env.AI_MODEL || "claude-sonnet-4-6",
  aiEnabled: booleanEnv("AI_ENABLED", false),
  aiAssessmentsEnabled: booleanEnv("AI_ASSESSMENTS_ENABLED", false),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  aiMaxTokens: Number(process.env.AI_MAX_TOKENS) || 1800,

  corsOrigins,
  publicAppUrl: process.env.PUBLIC_APP_URL || corsOrigins[0] || "http://localhost:5173",
  sandboxPaymentWebhookSecret: process.env.SANDBOX_PAYMENT_WEBHOOK_SECRET || "",
  walletEncryptionKey: process.env.WALLET_ENCRYPTION_KEY || "",
  trustProxyHops,
  apiRateLimitMax,
  dbSslRejectUnauthorized: booleanEnv("DB_SSL_REJECT_UNAUTHORIZED", true),

  isProduction: nodeEnv === "production",
};

export default env;
