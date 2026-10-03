import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import onboardingRoutes from "./onboardingRoutes.js";
import careerSkillRoutes from "./careerSkillRoutes.js";
import skillAnalysisRoutes from "./skillAnalysisRoutes.js";
import skillRoutes from "./skillRoutes.js";
import careerCategoryRoutes from "./careerCategoryRoutes.js";
import careerRoutes from "./careerRoutes.js";
import roadmapRoutes from "./roadmapRoutes.js";
import aiRoutes from "./aiRoutes.js";
import projectRoutes from "./projectRoutes.js";
import missionRoutes from "./missionRoutes.js";
import challengeRoutes from "./challengeRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import progressRoutes from "./progressRoutes.js";
import careerReadinessRoutes from "./careerReadinessRoutes.js";
import portfolioRoutes from "./portfolioRoutes.js";
import learningResourceRoutes from "./learningResourceRoutes.js";
import courseRoutes from "./courseRoutes.js";
import assessmentRoutes from "./assessmentRoutes.js";
import projectSubmissionRoutes from "./projectSubmissionRoutes.js";
import evidenceReadinessRoutes from "./evidenceReadinessRoutes.js";
import careerMatchRoutes from "./careerMatchRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import commerceRoutes from "./commerceRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import referralRoutes from "./referralRoutes.js";
import adminRoutes from "./adminRoutes.js";
import accountRoutes from "./accountRoutes.js";
import { pool } from "../config/db.js";

import manualPaymentRoutes from "./manualPaymentRoutes.js";
const router = Router();
router.use("/manual-payments", manualPaymentRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "skillforge-ai-backend",
    timestamp: new Date().toISOString(),
  });
});
router.get("/ready", async (req, res) => {
  try {
    const result = await pool.query(`SELECT
      to_regclass('public.users') IS NOT NULL AS users_ready,
      to_regclass('public.skillforge_schema_migrations') IS NOT NULL AS migrations_ready,
      EXISTS (SELECT 1 FROM skillforge_schema_migrations WHERE filename='046_seed_pkr_product_prices.sql') AS current_schema`);
    const ready = Object.values(result.rows[0]).every(Boolean);
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", database: ready ? "ready" : "schema_incomplete" });
  } catch { res.status(503).json({ status: "not_ready", database: "unavailable" }); }
});

router.use("/auth", authRoutes); // Phase 2
router.use("/profile", profileRoutes); // Phase 2
router.use("/onboarding", onboardingRoutes); // Phase 3
router.use("/career-skills", careerSkillRoutes); // Phase 4A (legacy — superseded by /careers/:id/skills)
router.use("/skill-analysis", skillAnalysisRoutes); // Phase 4A
router.use("/skills", skillRoutes); // Phase 4A + Phase 5A universal catalog
router.use("/career-categories", careerCategoryRoutes); // Phase 5A
router.use("/careers", careerRoutes); // Phase 5A
router.use("/roadmap", roadmapRoutes); // Phase 6A + Phase 6B
router.use("/ai", aiRoutes); // Phase 6C-1 AI service foundation
router.use("/projects", projectRoutes); // Phase 7A Projects Engine
router.use("/missions", missionRoutes); // Phase 7C Daily Missions
router.use("/challenges", challengeRoutes); // Phase 7D Coding Challenges
router.use("/dashboard", dashboardRoutes); // Phase 7E Unified personalization overview
router.use("/progress", progressRoutes); // Phase 8A Unified progress tracking
router.use("/career-readiness", careerReadinessRoutes); // Phase 8C transparent readiness
router.use("/portfolios", portfolioRoutes); // Phase 9A portfolio foundation
router.use("/learning-resources", learningResourceRoutes); // Verified catalog + personalized recommendations
router.use("/courses", courseRoutes); // Structured courses, lessons, prerequisites and progress
router.use("/assessments", assessmentRoutes); // Versioned quizzes, attempts and grading
router.use("/project-submissions", projectSubmissionRoutes); // Immutable project evidence and review workflow
router.use("/evidence-readiness", evidenceReadinessRoutes); // Versioned evidence-based readiness
router.use("/career-match", careerMatchRoutes); // Deterministic evidence-to-career ranking
router.use("/certificates", certificateRoutes); // Completion certificates and public verification
router.use("/commerce", commerceRoutes); // Server-priced products, orders and permanent access
router.use("/payments", paymentRoutes); // Signed sandbox payments and receipts
router.use("/referrals", referralRoutes); // Referral attribution, wallet and withdrawals
router.use("/admin", adminRoutes); // Consolidated administration and audit controls
router.use("/account", accountRoutes); // Privacy preferences, export and deletion


export default router;
