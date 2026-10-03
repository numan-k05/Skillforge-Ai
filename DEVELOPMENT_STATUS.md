# SkillForge development status

Updated: 2026-09-26

## Completed checkpoints

### Original Phase 1 stabilization — complete

Authentication/JWT route protection, request validation, CORS, rate limiting, ownership boundaries, consistent API errors, safe environment examples, unsupported marketing-copy corrections, frontend lint cleanup and the essential authentication regression suite are complete. See `PHASE_1_REPORT.md` for the detailed audit and setup notes.

### Milestone 1A design foundation — complete

- Applied the navy, purple and cyan design tokens, shared responsive styles, focus treatment, reduced-motion support and readable contrast across the existing application.
- Added reusable field, modal, feedback, toast, progress/score, tab and data-table components.
- Replaced the authenticated navigation with a desktop sidebar and responsive modal menu, including explicit focus containment, Escape close and focus restoration.
- Added real API-backed `/skills`, `/skills/:id` and protected `/settings` routes. Skill resources retain provider attribution and original external URLs.
- Added deterministic Lucide skill/category icons with a fallback for all current and future catalog entries.
- Added route lazy loading, loading feedback and route-level error recovery. The production entry bundle is about 234 kB uncompressed; individual pages are split into route chunks.
- Kept roadmap generation on the internal deterministic engine and disabled legacy paid AI execution even when a legacy key is present.
- Added component/unit coverage and responsive Playwright flows for public routes, catalog/detail, settings, protected login redirect, mobile navigation and API failure recovery.

No database architecture changed and no existing skill was removed.

## Files changed in Milestone 1A

The main additions and edits are grouped below. Package lockfiles and generated build/test output are omitted.

- Planning/docs: `DEVELOPMENT_PLAN.md`, `DEVELOPMENT_STATUS.md`, `README.md`, `.gitignore`
- Frontend configuration/tests: `frontend/package.json`, `frontend/package-lock.json`, `frontend/.oxlintrc.json`, `frontend/playwright.config.js`, `frontend/test/designSystem.test.js`, `frontend/e2e/redesign.e2e.js`
- Frontend application: `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/context/toast.js`, `frontend/src/hooks/useRemoteData.js`, `frontend/src/layouts/CatalogLayout.jsx`
- Shared UI: `frontend/src/components/ui/Button.jsx`, `Field.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`, `Feedback.jsx`, `Indicators.jsx`, `Tabs.jsx`, `DataTable.jsx`, `ToastProvider.jsx`, `RouteErrorBoundary.jsx`
- Navigation/catalog/settings: `frontend/src/components/layout/AppNav.jsx`, `AppNav.css`, `frontend/src/components/skills/SkillIcon.jsx`, `frontend/src/pages/skills/SkillsPage.jsx`, `SkillDetailPage.jsx`, `SkillsPage.css`, `frontend/src/pages/app/SettingsPage.jsx`, `frontend/src/services/skillService.js`, `frontend/src/utils/skillPresentation.js`
- Visual system and existing screens: `frontend/src/styles/tokens.css`, `components.css`, `redesign.css`, plus coordinated CSS/copy updates on the landing, marketing, dashboard and existing feature pages.
- Backend deterministic boundary: `backend/src/services/aiService.js`, `backend/test/deterministic.test.js`

## Verification performed

- Frontend lint: pass, zero warnings.
- Frontend unit/component tests: 13 passed.
- Frontend production build: pass; 2,041 modules transformed with the consolidated administration chunk.
- Responsive browser tests: the prior checks remain, and evidence readiness, Career Match, and the private-to-public approved-evidence portfolio journey pass at desktop, tablet and mobile widths. The suite uses synthetic API fixtures and does not modify a real account or database. On this Windows host, Playwright prints final results but its Vite child-process cleanup does not exit on its own and must be interrupted after completion.
- Backend syntax: 146 JavaScript files passed.
- Backend automated tests: 60 passed, including authentication/security regressions, admin validation and final-administrator protection, commerce/payments, referrals and all earlier learning/evidence workflows.
- Real PostgreSQL migration/startup, SMTP delivery and deployment remain environment checks because no live database, mail account or production host was provided.

## Remaining milestones

### Milestone 2 — implemented in code; live PostgreSQL gate remains

- Added additive migrations `021_roles_and_audit.sql` and `022_courses_and_progress.sql`. They retain all existing skill IDs and resource URLs.
- Added database-backed learner, content-admin and admin roles. Privileged routes read the current database role instead of trusting a client or JWT role claim.
- Added audited course authoring, draft/published/archive states, ordered modules and lessons, validated HTTPS sources, existing learning-resource references and cycle-safe prerequisites.
- Added public paginated course catalog/detail APIs, locked lesson payloads, idempotent enrollment/completion, prerequisite enforcement, progress percentages and learning history.
- Added `/courses`, `/courses/:id`, `/learning` and `/course-admin` screens using the shared responsive design system. No fake course seed data was introduced.
- Added a confirmed operator CLI for assigning an existing user a content role and recording the change in `audit_logs`.
- Premium enrollment remains safely unavailable until the purchase/access-grant phase exists.
- Responsive browser checks for the course catalog and locked lesson detail passed at desktop, tablet and mobile widths.

The code and isolated tests are complete. Applying/rolling back migrations 021–022 against a real PostgreSQL instance is still required before this milestone can be accepted for deployment.

### Milestone 3 — implemented in code; live PostgreSQL gate remains

- Added migration `023_assessments.sql` for stable quiz identities, immutable definition versions, questions/options, attempts and submitted answers.
- Added cryptographically randomized question and option ordering that is persisted with each attempt.
- Kept answer correctness and explanations out of all in-progress learner payloads; they are disclosed only with the graded result.
- Added exact-set multi-answer grading, weighted points, pass marks, attempt limits, cooldowns, ownership checks and transactionally idempotent submission.
- Added draft/published/retired version flow. Published questions cannot be edited; administrators clone an editable version and historical attempts keep their original version.
- Added role-protected quiz/question authoring, replacement, deletion, publishing and audit records.
- Added `/assessments`, `/assessments/:id`, `/assessment-history` and `/quiz-admin` screens.
- Responsive browser checks confirmed that correctness is hidden before submission and shown after grading at desktop, tablet and mobile widths.

The code and isolated tests are complete. Migration 023 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–022.

### Milestone 4 — implemented in code; live PostgreSQL gate remains

- Added migration `024_project_evidence.sql` for submissions, immutable evidence versions, required milestone records, reviewer assignment, decisions and status history.
- Added draft → submitted → under review → approved/rejected transition enforcement with learner ownership and database-backed reviewer roles.
- Submitted/reviewed evidence cannot be edited. A rejection creates a new evidence version while preserving the reviewed version and feedback.
- Added HTTPS public-host validation, GitHub repository validation and no server-side fetching or execution of submitted code.
- Added transactionally idempotent claiming and repeated approval handling, reviewer ownership and audit records.
- Preserved all historical project progress. Existing completion is explicitly labeled self-reported until evidence is approved.
- Added `/projects/:id/evidence`, `/submissions`, `/project-reviews` and `/project-reviews/:id` learner/reviewer screens.
- Responsive browser checks passed for legacy-completion labeling, draft version creation and locked submission at desktop, tablet and mobile widths.

The code and isolated tests are complete. Migration 024 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–023.

### Milestone 5 — implemented in code; live PostgreSQL gate remains

- Added migration `025_evidence_readiness.sql` with versioned, reproducible snapshots and append-only project-evidence revocations.
- Added a separate authenticated `/evidence-readiness` API, preserving the existing skill-coverage `/career-readiness` API and its history.
- Implemented the documented 30/30/20/10/10 calculation for completed SkillForge courses, approved non-revoked projects, unique passed quizzes/completed challenges, explicit portfolio signals, and distinct active days.
- Added caps, de-duplication, zero-evidence behavior, stable score bands, source evidence, strengths, gaps and attainable next actions.
- Self-rated skills, manual external resources and legacy self-reported project completion earn no evidence points.
- Added audited reviewer/admin revocation and the responsive `/readiness` screen.
- Added deterministic tests for arithmetic, caps, duplicates, band boundaries, self-report exclusion and revocation recalculation.

The code and isolated tests are complete. Migration 025 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–024.

### Milestone 6 — implemented in code; live PostgreSQL gate remains

- Added additive migration `026_career_match_metadata.sql` for optional experience labels and editorial recommendation summaries. Existing careers work without backfills through deterministic labels derived from requirements.
- Added authenticated, validated and paginated `/career-match` rankings using active careers and active skill requirements only.
- Implemented the documented 40/20/20/10/10 weights for verified skill coverage, relevant passed assessments, approved career-linked projects, evidence readiness and portfolio quality.
- Verified skills come only from completed SkillForge courses, passed assessments and approved non-revoked projects. Self-ratings do not earn match points.
- Added deterministic tie ordering, component caps, missing-evidence behavior, met/missing requirements and links to published courses and active projects.
- Match responses exclude evidence URLs, private portfolio content, reviewer details and user identifiers. They make no live-job or employment guarantee.
- Added the responsive `/career-match` workspace screen and navigation entry.
- Added tests for exact arithmetic, duplicates/caps, empty evidence, experience labels, privacy-safe output and anonymous route denial.

The code and isolated tests are complete. Migration 026 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–025.

### Milestone 7 — implemented in code; live PostgreSQL gate remains

- Added migration `027_automatic_portfolio.sql` with private-by-default references from portfolios to immutable approved submission versions, plus visibility, ordering, link privacy and presentation overlays.
- Approval creates one hidden entry transactionally and idempotently. Existing approved submissions are backfilled as hidden entries. Revoked evidence is excluded from public output.
- Learners can edit public headline/description overlays without changing reviewed evidence, reorder entries, select visibility and independently select whether reviewed links are public.
- Added Classic, Compact and Showcase templates, explicit first-publication consent, a public-field allowlist and printable portfolio styling with a print action.
- Preserved all legacy manual portfolio projects, skills, links, achievements, slugs and public routes.
- Removed obsolete text claiming the public portfolio page was still pending.
- Added tests for approval idempotency, hidden/revoked evidence, link privacy, publish consent and the responsive management-to-public journey.

The code and isolated tests are complete. Migration 027 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–026.

### Milestone 8 — implemented in code; live PostgreSQL gate remains

- Added migration `028_completion_certificates.sql` for configured lesson, quiz, approved-project and evidence-readiness requirements, immutable issue snapshots, high-entropy verification codes and append-only issue/revocation history.
- Issuance rechecks every requirement inside a repeatable-read transaction, is idempotent per learner/program and records the exact evidence/readiness snapshot used.
- Added database-role-protected definition administration and audited certificate revocation endpoints. Revoked certificates remain publicly verifiable with a clear revoked status.
- Added privacy-limited public verification, 192-bit URL-safe codes, downloadable PDF certificates and embedded QR links to the configured public frontend origin.
- Added the protected `/certificates` learner screen and public `/certificates/verify/:code` screen. Copy consistently says “SkillForge completion certificate” and explicitly avoids accreditation, degree, licensing or employment claims.
- Added deterministic coverage for unmet/exact eligibility, code format/uniqueness, public-field disclosure, PDF output, QR destination and anonymous access denial.

The code and isolated tests are complete. Migration 028 still needs a real PostgreSQL apply/rollback rehearsal with migrations 021–027. No certificate definitions are fabricated or seeded; an administrator must configure and activate one using the protected API.

### Milestone 9 — implemented in code; live PostgreSQL gate remains

- Added migration `029_permanent_skill_access.sql` for skill products, currency prices, bounded discounts, immutable server-calculated orders/items, payment records, permanent grants and explicit premium-content rules.
- Existing learners enrolled in premium courses receive additive legacy grants. Existing skills and learning records are preserved; no skill was removed or renamed.
- Client totals are ignored. Product availability, currency prices and discounts are reloaded and locked while each pending order is created.
- Pending orders never grant access. Phase 10 must verify a signed payment event before creating purchase grants; no frontend success URL can unlock content.
- Added one shared entitlement check to premium course enrollment/lesson completion, quiz starts, project detail/start/status and certificate issuance. Content without an explicit premium rule remains available under its existing behavior.
- Added role-protected product/pricing creation with audit records, the public `/store` catalog and authenticated `/purchases` order/access history.
- Refund/dispute policy is explicit: a future audited payment transition revokes related grants. No payment provider, card collection or simulated successful payment was added.

The code and isolated tests are complete. Migration 029 and the legacy-access backfill still need a real PostgreSQL apply/rollback rehearsal. Product administration currently uses the protected API; its consolidated management screen remains part of Milestone 12.

### Milestone 10 — implemented in code; live PostgreSQL gate remains

- Added migration `030_payment_gateway.sql` for unique provider references/events, timestamped payment states, append-only transition history and server-generated receipts.
- Added HMAC-SHA256 verification over the exact raw request bytes and timestamp, constant-time comparison, a five-minute replay window and event-ID/payload-hash collision detection.
- Event processing locks payment/order rows and validates provider reference, order ID, amount and currency before applying an allowed transition. Duplicate events are idempotent; forged, mismatched and out-of-order events are rejected and recorded.
- Only a verified `payment.paid` transition creates permanent grants. Verified refunds/disputes revoke related grants while preserving access supplied by another paid order.
- Added authenticated sandbox checkout, success/failure and receipt screens. They collect no card or bank data and read the authoritative server state.
- The developer simulator generates a signed event and passes through the same webhook verification path. All sandbox checkout, simulator and webhook routes return unavailable in production.
- No production payment provider was activated. Provider credentials, merchant approval and verified provider-specific documentation remain external requirements.

The code and isolated tests are complete. Migration 030 and concurrent webhook processing still need a real PostgreSQL apply/rollback and integration rehearsal.

### Milestone 11 — implemented in code; live PostgreSQL gate remains

- Added migration `031_referrals_wallet.sql` for secure codes, single bounded attribution, commission policies, one reward per paid order, held/available/reversed states, an append-only currency ledger and reviewed withdrawals.
- Prevented self-referrals, repeat attribution and attribution after a first paid order. Attribution expires after 30 days.
- Rewards derive only from verified paid orders and configured basis points. They become available after the configured hold; refunds/disputes append reversals.
- Wallet and withdrawal operations use transaction advisory locks per user/currency. A pending withdrawal reserves funds and rejection appends a release.
- Payout destinations are encrypted with AES-256-GCM and only a masked hint is returned. Administrators can approve, reject or record payment with database-role checks and audit records; recording payment does not claim an automatic transfer.
- Added the authenticated `/wallet` referral, reward, balance and withdrawal screen. No automatic bank integration or fabricated commission policy was enabled.

The code and isolated tests are complete. Migration 031, reward maturation/reversal and concurrent withdrawal behavior still require a real PostgreSQL integration rehearsal. Commission policies must be inserted by an administrator before rewards or withdrawals activate; the consolidated policy UI remains Milestone 12.

### Milestone 12 — implemented in code; live PostgreSQL gate remains

- Added an administrator-only API for operational counts, paginated user/role management, paginated audit history and commission policy management.
- Role checks always read the current database role. User-role changes are validated and audited, and both the API and bootstrap CLI prevent demoting the final administrator.
- Added `/admin` as the consolidated operations workspace with links to existing course, quiz and evidence-review tools plus user roles, policy configuration, withdrawal decisions and recent audit history.
- Existing certificate and commerce administration APIs remain available from the same protected backend role foundation. No public admin-registration path exists.
- Sensitive writes continue to use backend validation, role checks and audit records. Learner profile APIs cannot change roles.

The code and isolated tests are complete. Representative role-matrix behavior, pagination queries and last-admin concurrency still require a real PostgreSQL and browser integration rehearsal. Broader product/certificate editing forms can be expanded inside the consolidated workspace without changing their protected APIs.

### Milestone 13 — complete in development

- Added migration `032_account_privacy.sql` for account deactivation, communication/public-profile preferences, append-only versioned consent history and deletion-retention records.
- Added protected preference, consent, JSON export and reauthenticated deletion APIs. Export excludes password hashes, tokens, webhook material and encrypted payout details.
- Account deletion immediately invalidates existing JWT access, anonymizes the login identity, removes profile/public and learning records, and preserves pseudonymous financial, certificate, referral and audit records needed for integrity.
- Prevented deletion while a withdrawal is pending or approved and prevented deletion of the final administrator.
- Added account settings for communication choices, public-profile permission, data download and confirmed deletion. Disabling public visibility immediately unpublishes the portfolio.
- Added public privacy, terms and refund-disclosure pages with visible owner-review placeholders instead of invented legal identity, jurisdiction or production refund promises.
- Applied migration 032 to the development PostgreSQL database and validated export/deletion SQL inside a rolled-back live transaction.

### Milestone 14 — development acceptance complete

- Added GitHub Actions acceptance workflow with lockfile installs, a clean PostgreSQL service, all migrations, database invariants, backend syntax/tests, frontend lint/tests/build and responsive Playwright checks.
- Added `db:verify` and `db:rehearse`. The latest local disposable-database rehearsal applies migrations 001–034 from empty state, verifies all migration records, preserves 87 unique skills, creates eight source-attributed published starter courses and eight versioned starter assessments, then removes the temporary database.
- Added `/api/ready` for database/schema readiness while preserving `/api/health` as process liveness.
- Added request IDs and structured JSON HTTP logs. Recursive redaction covers credentials, tokens, cookies, signatures, email fields and payout destinations; request bodies and query strings are not logged.
- Added tighter hourly limits to account export and deletion alongside existing authentication and general API limits.
- Expanded responsive browser fixtures to cover public legal routes plus privacy preferences, account export and confirmed deletion on desktop, tablet and mobile.
- Added deployment/release, backup/restore and manual acceptance runbooks under `docs/`.
- Local results: backend syntax 154 files, backend tests 65, frontend tests 13, lint zero warnings, production build 2,043 modules, and 39 responsive browser checks passed (36 in the full run plus the corrected privacy journey's 3 viewport checks).

All planned development milestones are implemented. No additional internal phase remains in `DEVELOPMENT_PLAN.md`.

## Continuation instruction

Before a public production release, complete the external items in `docs/RELEASE_CHECKLIST.md`: owner/legal approval, approved merchant credentials and real provider webhook tests, production SMTP and infrastructure configuration, CI execution on the hosted repository, backup/restore rehearsal on the chosen provider, monitoring/alert ownership and a manual release review.
