import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { signupSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema } from "../utils/validation.js";
import {
  signupController,
  loginController,
  requestPasswordResetController,
  resetPasswordController,
  logoutController,
  meController,
} from "../controllers/authController.js";

const router = Router();

// Authentication endpoints are intentionally much stricter than the general
// API limiter to reduce credential-stuffing and account-enumeration abuse.
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many authentication attempts. Please try again later." } },
});

router.post("/signup", authAttemptLimiter, validate(signupSchema), signupController);
router.post("/login", authAttemptLimiter, validate(loginSchema), loginController);
router.post("/forgot-password", authAttemptLimiter, validate(requestPasswordResetSchema), requestPasswordResetController);
router.post("/reset-password", authAttemptLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post("/logout", requireAuth, logoutController);
router.get("/me", requireAuth, meController);

export default router;
