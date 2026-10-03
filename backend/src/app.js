import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { ApiError, notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./utils/logger.js";

const app = express();

// Only trust forwarded IPs when the deployment explicitly configures its proxy hops.
app.set("trust proxy", env.trustProxyHops || false);

// --- Security & parsing middleware ---
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, health checks) do not send Origin.
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, "This origin is not allowed."));
    },
    credentials: true,
  })
);

// API responses can contain authenticated user data; prevent intermediary and
// browser caches from retaining those responses. Public portfolio responses
// are intentionally read-only but are covered by the same safe default.
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "1mb", verify(req, res, buffer) { if (req.originalUrl === "/api/payments/webhooks/sandbox") req.rawBody = Buffer.from(buffer); } }));
app.use(express.urlencoded({ extended: true, limit: "100kb", parameterLimit: 100 }));
if (env.nodeEnv !== "test") app.use(requestLogger);

// --- Rate limiting (applies to all /api routes) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Public catalogs and the dashboard make several parallel requests. Keep
  // authentication and sensitive routes on their own tighter limiters.
  max: env.nodeEnv === "test" ? 300 : env.apiRateLimitMax,
  message: { error: { message: "Too many requests. Please try again later." } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// --- Routes ---
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ message: "SkillForge AI API. See /api/health for status." });
});

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
