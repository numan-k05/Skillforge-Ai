import { z } from "zod";

/**
 * Sign-up: name, email, password, confirm password.
 * Password rules are intentionally simple (min length) — this is a
 * student-facing product, not a high-security system, but we still
 * never store anything in plain text (see authService).
 */
export const signupSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name is too long"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Enter a valid email address").max(255, "Email is too long"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address").max(255, "Email is too long"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string({ required_error: "Email is required" }).trim().toLowerCase().email("Enter a valid email address").max(255, "Email is too long"),
});

export const resetPasswordSchema = z.object({
  email: z.string({ required_error: "Email is required" }).trim().toLowerCase().email("Enter a valid email address").max(255, "Email is too long"),
  otp: z.string({ required_error: "Reset code is required" }).regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  password: z.string({ required_error: "New password is required" }).min(8, "Password must be at least 8 characters").max(128, "Password is too long")
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
  confirmPassword: z.string({ required_error: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
  university: z.string().trim().max(200).nullable().optional(),
  degree: z.string().trim().max(200).nullable().optional(),
  semester: z.coerce
    .number()
    .int("Semester must be a whole number")
    .min(1, "Semester must be between 1 and 20")
    .max(20, "Semester must be between 1 and 20")
    .nullable()
    .optional(),
  careerGoal: z.string().trim().max(160).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  weeklyHoursAvailable: z.coerce
    .number()
    .int("Weekly hours must be a whole number")
    .min(1, "Weekly hours must be between 1 and 168")
    .max(168, "Weekly hours must be between 1 and 168")
    .nullable()
    .optional(),
  learningGoals: z.string().trim().max(2000).nullable().optional(),
  interests: z.array(z.string().trim().min(1).max(80)).max(10, "Pick up to 10 interests").optional(),
});

/**
 * Onboarding: same shape as the profile fields, but everything is
 * optional at the schema level except that the frontend is expected to
 * collect them across steps — the service layer decides what's
 * effectively required for a "complete" onboarding.
 */
export const onboardingCompleteSchema = z.object({
  university: z.string().trim().max(200).optional(),
  degree: z.string().trim().max(200).optional(),
  semester: z.coerce
    .number()
    .int("Semester must be a whole number")
    .min(1, "Semester must be between 1 and 20")
    .max(20, "Semester must be between 1 and 20")
    .optional(),
  country: z.string().trim().max(120).optional(),
  careerGoal: z.string().trim().min(2, "Career goal is too short").max(160).optional(),
  weeklyHoursAvailable: z.coerce
    .number()
    .int("Weekly hours must be a whole number")
    .min(1, "Weekly hours must be between 1 and 168")
    .max(168, "Weekly hours must be between 1 and 168")
    .optional(),
  learningGoals: z.string().trim().max(2000).optional(),
  interests: z
    .array(z.string().trim().min(1).max(80))
    .max(10, "Pick up to 10 interests")
    .optional()
    .default([]),
});

/**
 * Phase 4A: a student self-reporting their level (0-5) in a list of
 * skills. Skills not already in the catalog are created on the fly
 * (see userSkillModel.replaceUserSkills), same get-or-create pattern
 * used for interests.
 */
export const updateSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Skill name is required").max(120),
        level: z.coerce
          .number()
          .int("Skill level must be a whole number")
          .min(0, "Skill level must be between 0 and 5")
          .max(5, "Skill level must be between 0 and 5"),
      })
    )
    .max(50, "Too many skills in one request"),
});

/**
 * Phase 6A: roadmap generation/regeneration. `timelineWeeks` is
 * optional — when omitted, the roadmap engine derives a target from
 * the user's `weekly_hours_available` and the estimated total hours.
 */
export const generateRoadmapSchema = z.object({
  timelineWeeks: z.coerce
    .number()
    .int("Timeline must be a whole number of weeks")
    .min(1, "Timeline must be between 1 and 260 weeks")
    .max(260, "Timeline must be between 1 and 260 weeks")
    .optional(),
});

export const updateMissionStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "skipped"], {
    required_error: "Mission status is required",
  }),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "paused"], {
    required_error: "Project status is required",
    invalid_type_error: "Status must be one of: not_started, in_progress, completed, paused",
  }),
});

export const updateRoadmapStatusSchema = z.object({
  status: z.enum(["draft", "active", "completed", "archived"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be one of: draft, active, completed, archived",
  }),
});

const portfolioSlug = z.string().trim().toLowerCase()
  .min(3, "Portfolio slug must be at least 3 characters")
  .max(80, "Portfolio slug is too long")
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])?$/, "Use lowercase letters, numbers, and single hyphens only");

export const portfolioSlugParamSchema = z.object({
  slug: portfolioSlug,
});

export const portfolioProfileSchema = z.object({
  slug: portfolioSlug.optional(),
  isPublic: z.boolean().optional(),
  biography: z.string().trim().max(4000, "Biography is too long").nullable().optional(),
  education: z.string().trim().max(1000, "Education is too long").nullable().optional(),
  showCareerGoal: z.boolean().optional(),
  template:z.enum(["classic","compact","showcase"]).optional(),
  publishConsent:z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one portfolio field.");

export const portfolioEvidenceSchema=z.object({entries:z.array(z.object({entryId:z.coerce.number().int().positive(),isVisible:z.boolean(),showEvidenceLinks:z.boolean().default(false),displayOrder:z.coerce.number().int().min(1).max(1000),headline:z.string().trim().min(1).max(200).nullable().optional(),description:z.string().trim().max(4000).nullable().optional()})).max(100).refine(items=>new Set(items.map(x=>x.entryId)).size===items.length,"Evidence entries must be unique")});

const orderedIds = z.array(z.coerce.number().int().positive()).max(50)
  .refine((ids) => new Set(ids).size === ids.length, "Selections must not contain duplicates");

export const portfolioContentSchema = z.object({
  projectIds: orderedIds.optional(),
  skillIds: orderedIds.optional(),
  links: z.array(z.object({
    label: z.string().trim().min(1, "Link label is required").max(80),
    url: z.string().trim().url("Link must be a valid URL").max(2048)
      .refine((value) => /^https?:\/\//i.test(value), "Link must use http or https"),
  })).max(20).optional(),
  achievements: z.array(z.object({
    title: z.string().trim().min(1, "Achievement title is required").max(160),
    description: z.string().trim().max(1000).nullable().optional(),
    achievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Achievement date must use YYYY-MM-DD").optional(),
  })).max(30).optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one portfolio content field.");

export const positiveIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const learningResourceFiltersQuerySchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  free: z.enum(["true", "false"]).optional().transform((value) => value === undefined ? undefined : value === "true"),
  page: z.coerce.number().int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int("Limit must be a whole number").min(1, "Limit must be at least 1").max(24, "Limit must be at most 24").default(6),
});

export const challengeSubmissionSchema = z.object({
  answer: z.string().trim().min(1, "Submit an answer before checking it.").max(10000, "Answer is too long."),
});

export const challengeFiltersSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  skillId: z.coerce.number().int().positive().optional(),
  category: z.string().trim().min(1).max(120).optional(),
});

export const challengeRecommendationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

const optionalHttpsUrl = z.string().trim().max(2048).url("Enter a valid URL")
  .refine((value) => value.startsWith("https://"), "URL must use https").nullable().optional();

export const courseCatalogQuerySchema = z.object({
  skillId: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const courseSchema = z.object({
  skillId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().toLowerCase().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
  description: z.string().trim().min(20).max(10000),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedHours: z.coerce.number().int().min(1).max(1000),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isPremium: z.boolean().default(false),
});

export const courseUpdateSchema = courseSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one course field");
export const courseModuleSchema = z.object({
  title: z.string().trim().min(2).max(200), description: z.string().trim().max(4000).nullable().optional(),
  position: z.coerce.number().int().min(1).max(1000),
});
export const courseModuleUpdateSchema = courseModuleSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one module field");
export const courseLessonSchema = z.object({
  title: z.string().trim().min(2).max(240), summary: z.string().trim().max(4000).nullable().optional(),
  content: z.string().trim().max(50000).nullable().optional(), sourceResourceId: z.coerce.number().int().positive().nullable().optional(),
  sourceUrl: optionalHttpsUrl, provider: z.string().trim().max(160).nullable().optional(),
  lessonType: z.enum(["reading", "video", "documentation", "tutorial", "practice", "project"]).default("reading"),
  estimatedMinutes: z.coerce.number().int().min(1).max(1440), position: z.coerce.number().int().min(1).max(1000),
  isPreview: z.boolean().default(false), isActive: z.boolean().default(true),
});
export const courseLessonUpdateSchema = courseLessonSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one lesson field");
export const coursePrerequisitesSchema = z.object({
  courseIds: z.array(z.coerce.number().int().positive()).max(30).refine((ids) => new Set(ids).size === ids.length, "Prerequisites must be unique"),
});

export const quizFiltersSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(), lessonId: z.coerce.number().int().positive().optional(),
  skillId: z.coerce.number().int().positive().optional(), page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
}).refine((value) => [value.courseId,value.lessonId,value.skillId].filter(Boolean).length <= 1, "Use only one quiz target filter");

export const quizCreateSchema = z.object({
  title: z.string().trim().min(3).max(240), courseId: z.coerce.number().int().positive().nullable().optional(),
  lessonId: z.coerce.number().int().positive().nullable().optional(), skillId: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().trim().max(10000).nullable().optional(), passPercent: z.coerce.number().int().min(1).max(100).default(70),
  maxAttempts: z.coerce.number().int().min(1).max(100).default(3), cooldownMinutes: z.coerce.number().int().min(0).max(525600).default(0),
}).refine((value) => [value.courseId,value.lessonId,value.skillId].filter((item)=>item!=null).length === 1, { message:"Choose exactly one course, lesson, or skill target", path:["target"] });

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(3).max(10000), explanation: z.string().trim().max(10000).nullable().optional(),
  position: z.coerce.number().int().min(1).max(1000), points: z.coerce.number().int().min(1).max(100).default(1),
  options: z.array(z.object({ text: z.string().trim().min(1).max(4000), isCorrect: z.boolean(), position: z.coerce.number().int().min(1).max(100) })).min(2).max(20)
    .refine((options)=>options.some((option)=>option.isCorrect),"At least one option must be correct")
    .refine((options)=>new Set(options.map((option)=>option.position)).size===options.length,"Option positions must be unique"),
});

export const quizSubmissionSchema = z.object({ answers: z.array(z.object({
  questionId: z.coerce.number().int().positive(), selectedOptionIds: z.array(z.coerce.number().int().positive()).max(20)
    .refine((ids)=>new Set(ids).size===ids.length,"Selected options must be unique"),
})).min(1).max(200).refine((answers)=>new Set(answers.map((answer)=>answer.questionId)).size===answers.length,"Questions must be unique") });

function isPublicHttps(value){try{const url=new URL(value);const host=url.hostname.toLowerCase();return url.protocol==="https:"&&host!=="localhost"&&host!=="127.0.0.1"&&host!=="::1"&&!/^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host);}catch{return false;}}
const evidenceUrl=z.string().trim().max(2048).refine(isPublicHttps,"Evidence links must use HTTPS and a public host").nullable().optional();
export const projectEvidenceSchema=z.object({
  summary:z.string().trim().min(20,"Describe the work in at least 20 characters").max(10000),
  repositoryUrl:evidenceUrl.refine(value=>!value||["github.com","www.github.com"].includes(new URL(value).hostname.toLowerCase()),"Repository URL must be a GitHub HTTPS link"),
  demoUrl:evidenceUrl,evidenceUrl,
  milestones:z.array(z.object({milestoneId:z.coerce.number().int().positive(),evidenceNote:z.string().trim().max(4000).nullable().optional(),evidenceUrl}))
    .max(100).refine(items=>new Set(items.map(item=>item.milestoneId)).size===items.length,"Milestones must be unique").default([]),
}).refine(value=>Boolean(value.repositoryUrl||value.demoUrl||value.evidenceUrl||value.milestones.some(item=>item.evidenceUrl)),{message:"Provide at least one evidence link",path:["evidenceUrl"]});
export const projectReviewDecisionSchema=z.object({decision:z.enum(["approved","rejected"]),feedback:z.string().trim().min(10,"Feedback must be at least 10 characters").max(10000)});
export const submissionQueueQuerySchema=z.object({status:z.enum(["submitted","under_review"]).optional(),page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)});
export const evidenceRevocationSchema=z.object({reason:z.string().trim().min(10,"Revocation reason must be at least 10 characters").max(4000)});
export const careerMatchQuerySchema=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(24).default(12),categoryId:z.coerce.number().int().positive().optional()});
const uniqueCertificateIds=z.array(z.coerce.number().int().positive()).max(200).default([]).refine(values=>new Set(values).size===values.length,"Requirements must be unique");
export const certificateDefinitionSchema=z.object({
  title:z.string().trim().min(3).max(200),slug:z.string().trim().toLowerCase().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Use lowercase letters, numbers and single hyphens"),
  description:z.string().trim().max(4000).nullable().optional(),requiredReadinessScore:z.coerce.number().int().min(0).max(100).default(0),isActive:z.boolean().default(false),
  lessonIds:uniqueCertificateIds,quizIds:uniqueCertificateIds,projectIds:uniqueCertificateIds,
}).refine(value=>value.lessonIds.length+value.quizIds.length+value.projectIds.length+value.requiredReadinessScore>0,{message:"Configure at least one completion requirement",path:["requirements"]});
export const certificateCodeParamSchema=z.object({code:z.string().regex(/^[A-Za-z0-9_-]{32}$/,"Invalid verification code")});
export const certificateRevocationSchema=z.object({reason:z.string().trim().min(10,"Revocation reason must be at least 10 characters").max(4000)});
const currencyCode=z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/,"Currency must be a three-letter ISO code");
export const commerceCatalogQuerySchema=z.object({currency:currencyCode.default("USD")});
export const orderQuoteSchema=z.object({productIds:z.array(z.coerce.number().int().positive()).min(1).max(20).refine(ids=>new Set(ids).size===ids.length,"Products must be unique"),currency:currencyCode,discountCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/).optional()});
export const productCreateSchema=z.object({name:z.string().trim().min(3).max(200),slug:z.string().trim().toLowerCase().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().trim().max(4000).nullable().optional(),status:z.enum(["draft","active","archived"]).default("draft"),skillIds:z.array(z.coerce.number().int().positive()).min(1).max(49).refine(ids=>new Set(ids).size===ids.length,"Skills must be unique"),prices:z.array(z.object({currency:currencyCode,amountMinor:z.coerce.number().int().min(0).max(1000000000)})).min(1).max(20).refine(rows=>new Set(rows.map(x=>x.currency)).size===rows.length,"Currencies must be unique"),contentRules:z.array(z.object({entityType:z.enum(["course","quiz","project","certificate"]),entityId:z.coerce.number().int().positive()})).max(500).default([]).refine(rows=>new Set(rows.map(x=>`${x.entityType}:${x.entityId}`)).size===rows.length,"Content rules must be unique")});
export const sandboxSimulationSchema=z.object({type:z.enum(["payment.paid","payment.failed","payment.refunded","payment.disputed"])});
export const paymentWebhookEventSchema=z.object({eventId:z.string().min(8).max(200),type:z.enum(["payment.paid","payment.failed","payment.refunded","payment.disputed"]),providerReference:z.string().min(8).max(200),orderId:z.coerce.number().int().positive(),amountMinor:z.coerce.number().int().min(0).max(1000000000),currency:currencyCode}).strict();
export const referralCodeSchema=z.object({code:z.string().trim().regex(/^[A-Za-z0-9_-]{12,32}$/,"Invalid referral code")});
export const withdrawalSchema=z.object({currency:currencyCode,amountMinor:z.coerce.number().int().positive().max(1000000000),destination:z.string().trim().min(4).max(500)});
export const withdrawalDecisionSchema=z.object({decision:z.enum(["approved","rejected","paid"]),note:z.string().trim().min(3).max(1000)});
export const adminListQuerySchema=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(120).optional()});
export const userRoleSchema=z.object({role:z.enum(["learner","content_admin","admin"])});
export const commissionPolicySchema=z.object({currency:currencyCode,basisPoints:z.coerce.number().int().min(0).max(5000),holdDays:z.coerce.number().int().min(0).max(180),minimumWithdrawalMinor:z.coerce.number().int().positive().max(1000000000),isActive:z.boolean().default(true)});
export const accountPreferencesSchema=z.object({productUpdates:z.boolean().optional(),learningReminders:z.boolean().optional(),publicProfileVisible:z.boolean().optional()}).refine(value=>Object.keys(value).length>0,"Provide at least one preference");
export const consentSchema=z.object({type:z.enum(["terms","privacy","marketing"]),documentVersion:z.string().trim().min(1).max(40),granted:z.boolean()});
export const accountDeletionSchema=z.object({password:z.string().min(1).max(128),confirmation:z.literal("DELETE")});

export default {
  signupSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  onboardingCompleteSchema,
  updateSkillsSchema,
  generateRoadmapSchema,
  updateRoadmapStatusSchema,
  updateProjectStatusSchema,
  updateMissionStatusSchema,
  portfolioSlugParamSchema,
  portfolioProfileSchema,
  portfolioContentSchema,
  positiveIdParamSchema,
  learningResourceFiltersQuerySchema,
  challengeSubmissionSchema,
};
