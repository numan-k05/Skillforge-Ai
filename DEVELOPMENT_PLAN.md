# SkillForge development plan

## Baseline and safety

Phase 1 stabilization is complete and will not be repeated. Existing stack: React 19/Vite 8, Express 5, PostgreSQL, JWT/bcrypt, Zod validation, model/service/controller/route layers, numbered SQL migrations 001–020. Existing tests cover authentication, API errors, authorization boundaries and password reset. No Git repository or applicable AGENTS.md was found.

Source checkpoint: `../checkpoints/before-milestone-1-2026-09-22T19-02-39-252Z/` (270 files; SHA-256 inventory in CHECKPOINT_MANIFEST.json). Real environment files, dependencies and build outputs are excluded. Never overwrite unrelated work or edit real `.env` files. Existing skill IDs, seeds and resource URLs must remain intact. No new authentication system, Supabase Auth, paid AI calls, unverified payment grants, or execution of submitted code.

## Existing versus missing

Existing: authentication/password reset, profile/onboarding, public skill and career APIs, skill-gap analysis, deterministic roadmap engine with an optional legacy AI adapter, project catalog and self-reported status, daily missions, answer-matching coding challenges, activity/progress, skill-coverage readiness, manual/public portfolios and attributed resource links.

Missing: course/module/lesson progress, quizzes, evidence/reviewer workflow, evidence-weighted readiness, Career Match, portfolio evidence automation, certificates, products/orders/access grants, payment webhooks, referral ledger/withdrawals, roles/admin tools, account export/deletion/consent, CI and real-database/E2E coverage. These are substantial connected systems, not changes to labels on existing pages.

## Dependency and compatibility decisions

1. Milestone 1 is delivered in a runnable foundation checkpoint (1A) for all existing routes and real API-backed catalog/detail/settings views. The remaining Milestone 1 screens (1B) ship with their working backend milestones below. They will not be created as dummy checkout, wallet, certificate or admin pages. Milestone 1 as a whole is not complete until 1B is delivered.
2. Minimal backend roles and audit support must precede content administration in Milestone 2, although the consolidated admin workspace is Milestone 12. Roles extend `users`; authorization continues to use the existing verified JWT and database role lookup. Never trust an admin claim supplied by a client.
3. Existing free resources and user data remain usable. Before enabling commercial gates, create explicit legacy access grants for existing users/skills and preserve previously completed work. New premium content is gated on the server. External URLs themselves are not the product being sold.
4. Existing self-reported project completions remain visible as unverified. Only new approved evidence earns verified-project credit. Keep old readiness history labeled with its original method; version the new evidence calculation.
5. New portfolio entries default hidden unless the user explicitly opts in. Approval never silently publishes personal evidence.
6. No real payment provider will be activated without credentials and verified provider documentation. The signed test-provider webhook is a complete test integration, not a production gateway. No frontend return URL grants access.
7. Roadmaps and all new recommendations use deterministic database-driven rules. Disable the legacy paid AI execution path without touching stored credentials.
8. All money is integer minor units with an explicit currency. Rewards and withdrawals use an append-only ledger, database uniqueness and transactional locking, never a mutable balance alone.

## Milestones, implementation areas and acceptance gates

### 1A — Design foundation and existing application (current checkpoint)

- Apply the supplied navy/purple/cyan palette, readable text variants, consistent surfaces/borders, focus rings, touch targets and reduced-motion support across existing CSS.
- Redesign public navigation/hero, authenticated navigation, auth/onboarding, dashboard and existing feature screens through shared primitives and coordinated page styles. Keep routes, forms, handlers and features working.
- Add reusable labeled input/select, accessible modal/confirmation, tabs, tooltip, progress/score, data-table, empty/error/skeleton and toast primitives. Use Lucide category/skill icons with deterministic fallbacks for every current or future catalog entry.
- Add real public skills catalog/detail routes using existing APIs, preserve resource attribution and original external URLs. Add profile settings using the existing authenticated profile API.
- Lazy-load routes; provide route error/reload recovery and loading state. Avoid new image downloads or heavy animation dependencies.
- Tests: shared components, catalog filters/category mapping, route chunk generation, original auth regressions; browser checks at mobile/tablet/desktop where tooling permits.
- Database changes: none. Dependency additions only if required for repeatable component/browser tests; document precisely.

### 1B — Remaining feature screens (delivered with 2–13)

Courses/lessons, quiz attempts, verified submission/review, evidence readiness, Career Match, upgraded portfolio templates, certificates, checkout/receipts, referrals/wallet, privacy settings and admin screens use the same components and palette. No placeholder is counted as complete. Verify keyboard operation and responsive layouts for each.

### 2 — Structured courses and lesson tracking

- Proposed migrations 021 roles/audit and 022 courses/modules/lessons/prerequisites/progress. Reference existing `skills` and `learning_resources`; retain source URL/provider/creator/type/duration. Add draft/published status, stable ordering, preview/premium flags and indexes.
- Backend CRUD and admin authorization, prerequisite checks, idempotent start/complete endpoints, completion percentage, continue-learning and paginated history. Validate URL schemes/provider embedding policy. Track manual completion separately from independently verified evidence.
- Frontend catalog/course/lesson/history and content administration. Embed only explicitly supported providers; otherwise safe original-source links and external-watch-time disclaimer.
- Gate: real PostgreSQL migration/rollback rehearsal, ownership/access/prerequisite/progress tests and course UI tests. No fabricated course content or changed resource URLs.

### 3 — Assessments

- Migration 023 quiz definitions/versioned questions/options, target associations, attempts/answers/results and constraints. Questions can have multiple correct options; configurable pass mark, attempt count, cooldown/retakes.
- Server creates a persisted randomized question/answer order for each attempt, strips correctness until allowed result disclosure, grades exact answer sets transactionally, enforces attempt ownership/limits and retains versioned history. Admin authoring UI and user quiz/results UI.
- Gate: no answer leakage, tampered IDs/scores rejected, duplicate submit idempotency, retake/concurrency tests.

### 4 — Verified project submissions

- Migration 024 evidence submissions, required milestone records, review/status history and reviewer feedback. Reuse existing projects/skills. Validate GitHub/demo/evidence HTTPS URLs; do not execute code or fetch arbitrary private-network URLs.
- Draft/submitted/under-review/approved/rejected workflow with immutable reviewed evidence versions, resubmission and admin audit. Legacy completion stays unverified and visible.
- Gate: ownership, transitions, reviewer permissions, repeated approval, evidence history and review E2E.

### 5 — Evidence-based Job Readiness

- Migration 025 versioned evidence snapshots with 30/30/20/10/10 weights for verified learning, approved projects, quizzes/challenges, portfolio and consistency. Document denominators, caps, duplicate prevention and zero-evidence behavior; manual external completion is not independent verification.
- Keep old skill-coverage API/history backward compatible. New score: Beginner 0–39, Developing 40–59, Job Ready 60–79, Strong Candidate 80–100. Store reproducible evidence and show component contributions, gaps, strengths and attainable point deltas for next actions.
- Gate: exact arithmetic, caps, no self-rating-only high scores, evidence revocation recalculation and deterministic fixture tests.

### 6 — Career Match

- Reuse career requirements, supplement via migration 026 only where experience/recommendation metadata is missing. Score verified skills, assessments, approved projects, readiness and portfolio using documented deterministic rules.
- Return target roles, match %, met/missing requirements, linked course/project actions, experience label and explanation. No live jobs or employment guarantees.
- Gate: deterministic rankings, missing evidence, inactive content, privacy and pagination tests.

### 7 — Automatic portfolio

- Migration 027 approved-evidence portfolio references, editable presentation overlays, visibility/order and template preference. Approval inserts/upserts an initially private entry. Reviewed evidence cannot be altered through portfolio edits.
- Multiple responsive templates, explicit publish consent, completed skills/certificates, social metadata and printable resume/portfolio output. Public API is a field allowlist.
- Gate: hidden/private evidence never leaks, approval idempotency, reorder/overlay ownership, print layout and public metadata verification.

### 8 — Completion certificates

- Migration 028 configured lesson/quiz/project/readiness requirements and issued/revoked certificate history. Cryptographically secure unique code, immutable issue snapshot and explicit public-verification disclosure.
- Transactional eligibility checks and idempotent issuance, admin revocation, public verification, QR and downloadable PDF. Label only “SkillForge completion certificate”; no accreditation claim.
- Gate: unmet requirements denied, duplicate issuance, code enumeration resistance, revocation, PDF/QR link verification. Choose PDF/QR dependencies after checking current package compatibility.

### 9 — Permanent skill purchases

- Migration 029 products/currency prices/bundles/discounts/orders/items/payments/access grants plus grandfathered legacy access. Snapshot server-computed prices in minor units; never accept a client total. Define refund/dispute access policy explicitly.
- Server access checks on all premium lesson/quiz/project/certificate endpoints. Preview overview/basic roadmap/1–2 lessons/sample project remain free. User purchases/history and admin pricing controls.
- Gate: pricing/discount limits/currencies, legacy access, direct URL/API bypass attempts, immutable order amounts and durable grants.

### 10 — Gateway architecture

- Migration 030 webhook event IDs, payment transitions, receipts, refunds/disputes and append-only payment audit. Reusable provider interface with a signed sandbox provider; production adapter only against verified PayFast/Safepay docs.
- Raw-body signature verification, constant-time comparison, transactional idempotency, reference/amount/currency checks, replay rules, pending/paid/failed/refunded/disputed transitions. Grant permanent access only from verified paid events.
- Complete checkout/success/cancel/failure/receipt UI that reads server state, never grants access. Mock provider unavailable in production; document merchant approval/keys/webhook activation.
- Gate: forged/duplicate/out-of-order events, retries, concurrent processing, refund/dispute handling and purchase journey tests. No card/CVV storage.

### 11 — Referrals and wallet

- Migration 031 codes/attributions/relationships, commission policies, rewards, append-only ledger and withdrawal/payout audit. Unique reward per eligible verified purchase; secure bounded attribution, self-referral/fraud checks and configured hold/expiry/minimum withdrawal.
- Pending rewards become available after refund window; refunds/disputes append reversals. Currency-specific ledger sums and locked reservations prevent concurrent overwithdrawal. Minimize/protect payout details; never expose them publicly or in logs.
- User referral/history/wallet/withdrawal UI and admin approval/rejection/paid recording. Payout recording does not claim automatic bank transfer.
- Gate: duplicates, reversal after withdrawal, held balances, ownership, currency isolation, concurrency and audit invariants.

### 12 — Consolidated administration

- Extend the role/audit foundation with all requested users/roles, skills/categories, content/resources, quizzes/questions, submissions/reviews, careers/matches, certificates, commerce/referrals/withdrawals and site-settings screens. Add migrations for missing configuration only.
- Every sensitive write uses backend role checks, validation, audit and pagination. Prevent removing the last administrator and privilege escalation through normal profile APIs.
- Gate: role matrix tests on every admin endpoint and representative admin E2E. Provide a controlled bootstrap-admin CLI rather than a public admin-registration flow.

### 13 — Legal/privacy/account controls

- Migration 032 preference/consent/deletion records as needed. Privacy, terms, refund, certificate/referral disclosures with visible legal-name/address placeholders pending owner review. Do not claim legal compliance or invent corporate details.
- Authenticated data export, reauthenticated deletion workflow, communication preferences and explicit public-profile visibility. Reconcile deletion with minimal financial/audit retention; document policy and obtain actual legal requirements before claiming final legal wording.
- Gate: export/deletion ownership, removal from public views, consent/version history, no secret/payment data export, accessible legal pages. Cookie notice only for actual nonessential storage/tracking.

### 14 — Production acceptance

- CI installs from lockfiles; runs lint, backend syntax, unit/component/integration tests, clean-database migrations and frontend build. Isolated E2E DB covers registration → onboarding → preview → signed test payment → access → lesson → quiz → submission → admin approval → readiness → portfolio → certificate, then referral/hold/withdrawal.
- Add structured redacted logging/monitoring boundary, readiness health, sensitive endpoint limits, query/pagination/index review, lazy bundle review, mobile/keyboard/accessibility checks, backup/restore and deployment runbooks. Keep original authentication regression suite.
- Gate: all milestone acceptance checks, real PostgreSQL evidence, no unverified security-critical integration, clear external configuration list and manual release checklist. Production provider and legal review are external gates, not simulated completion.

## Execution and handoff contract

The migration numbers above are reservations, not files already created. Check the latest schema before each new migration; use additive constraints/backfills and document reversals where safe. Prefer integer IDs compatible with existing BIGSERIAL and UTC timestamps.

After each runnable checkpoint: frontend lint/build/tests, backend syntax/tests where affected, focused UI/integration tests, inspect diff against checkpoint, and record outcomes. Never call a planned module implemented. If this task reaches a safe session boundary, finish and verify the active checkpoint, leave no placeholder routes, update `DEVELOPMENT_STATUS.md` with exact files/results/limitations and a continuation instruction. No deployment or real merchant activation is implied by local test completion.
