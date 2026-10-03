import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { accountDeletionSchema, accountPreferencesSchema, consentSchema } from "../utils/validation.js";
import { createConsent, deleteAccount, exportAccount, getAccountPrivacy, updateAccountPreferences } from "../controllers/accountController.js";

const router = Router();
router.use(requireAuth);
const sensitiveAccountLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: { message: "Too many sensitive account requests. Please try again later." } } });
router.get("/privacy", getAccountPrivacy);
router.put("/preferences", validate(accountPreferencesSchema), updateAccountPreferences);
router.post("/consents", validate(consentSchema), createConsent);
router.get("/export", sensitiveAccountLimiter, exportAccount);
router.delete("/", sensitiveAccountLimiter, validate(accountDeletionSchema), deleteAccount);
export default router;
