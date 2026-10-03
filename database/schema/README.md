# Database schema (Phase 2–11C)

PostgreSQL schema for authentication, user profiles, onboarding, and the
universal skill/career intelligence system.

## Files

- `001_init.sql` — creates `users`, `career_goals`, `profiles`, `skills`,
  `user_skills`, with constraints, indexes, and `updated_at` triggers.
- `002_seed_skills.sql` — optional starter rows for the `skills` catalog.
- `003_onboarding.sql` — adds onboarding columns to `profiles`
  (`country`, `weekly_hours_available`, `learning_goals`,
  `onboarding_completed`, `onboarding_completed_at`), plus a new
  `interests` catalog and `user_interests` join table.
- `004_seed_interests.sql` — optional starter rows for the `interests`
  catalog.
- `005_career_skills.sql` — (Phase 4A) adds `career_skill_requirements`,
  a flat, free-text `career_title` → required-skill mapping.
- `006_seed_career_skills.sql` — (Phase 4A) seeds `career_skill_requirements`
  for 13 software/tech careers.
- `007_universal_careers.sql` — **(Phase 5A)** adds the normalized,
  DB-driven career taxonomy: `career_categories`, `careers`,
  `career_aliases`, `skill_categories`, and `career_skills` (the
  successor to `career_skill_requirements`). Also extends `skills` with
  `skill_category_id`, `skill_type`, `difficulty`, `is_active`.
- `008_migrate_existing_careers.sql` — **(Phase 5A)** seeds
  `career_categories` + `skill_categories`, copies (not moves) the 13
  Phase 4A careers and their requirements from `career_skill_requirements`
  into `careers` / `career_skills`, and rebuilds `career_aliases` from
  the old hardcoded alias map.
- `009_seed_universal_careers.sql` — **(Phase 5A)** adds the remaining
  Technology careers plus four new career groups — Design & Creative,
  Digital Marketing, Business & Professional, and Knowledge & Education
  — each with a realistic set of required/recommended skills.
- `010_roadmap.sql` — **(Phase 6A)** adds the personalized-roadmap
  backend foundation: `roadmaps` (one row per generated version, at
  most one `active` per user), `roadmap_phases` (ordered stages), and
  `roadmap_items` (learning/practice/project/assessment items, each
  optionally tied to a `skills` row). Nothing existing is modified.
- `011_projects.sql` — **(Phase 7A)** adds the project catalog, project ↔ skill/career mappings, milestones, and user project progress.
- `012_daily_missions.sql` — **(Phase 7C)** adds user-scoped daily missions generated from career goals, skill gaps, and active projects.
- `013_coding_challenges.sql` — **(Phase 7D)** adds coding challenge catalog and user challenge progress.
- `014_progress_tracking.sql` — **(Phase 8A)** adds append-only progress events for the existing roadmap, projects, missions, challenges, and skills.
- `015_career_readiness.sql` — **(Phase 8C)** adds career-readiness score history.
- `016_portfolio.sql` — **(Phase 9A)** adds a user-owned portfolio profile and selected project/skill/link/achievement records. It references existing account, profile, skill, and project data instead of duplicating it.
- `017_password_reset_otps.sql` — adds user-scoped password-reset OTP records used by the existing password-reset flow.
- `018_fix_career_aliases.sql` — corrects the normalized career-alias seed data without changing the career/skill schema.
- `019_learning_resources.sql` — adds the normalized `learning_resources` catalog linked directly to the global `skills` table. It does not alter roadmap or career tables.
- `020_seed_learning_resources.sql` — seeds curated HTTPS learning resources for the existing skill catalog; duplicate `(skill_id, url)` rows are ignored.
- `021_roles_and_audit.sql` — adds database-backed learner/content-admin/admin roles and an append-only audit log for privileged content changes.
- `022_courses_and_progress.sql` — adds courses, prerequisites, ordered modules and lessons, enrollment, and idempotent per-user lesson completion while referencing existing skills and learning resources.
- `023_assessments.sql` — adds versioned quiz definitions, questions/options, persisted randomized attempts, exact-set answers and immutable submitted results.
- `024_project_evidence.sql` — adds user-owned project evidence versions, required milestone records, review assignment, decisions and append-only status history.
- `025_evidence_readiness.sql` — adds versioned evidence-score snapshots and append-only approved-evidence revocations.
- `026_career_match_metadata.sql` — adds optional career experience and recommendation metadata used by deterministic Career Match.
- `027_automatic_portfolio.sql` — adds private-by-default approved-evidence references, presentation overlays, templates and publish-consent history.

- `032_account_privacy.sql` — adds account deactivation, communication/public-profile preferences, versioned consent history and deletion-retention records.
- `033_seed_starter_courses.sql` — publishes eight free starter courses backed by existing attributed learning resources, with one ordered module and lesson per course.
- `034_seed_starter_assessments.sql` — publishes eight versioned knowledge checks linked to the starter courses, with graded options and post-submission explanations.
- `035_react_skill_pass.sql` — expands React into the first complete premium track with lessons, assessment, projects, certificate, product, and access rules.
- `036_reprice_skill_pass.sql` / `037_decimal_plan_prices.sql` — apply the approved React Skill Pass launch-price revisions while preserving old order snapshots.
- `038_complete_skill_pass_catalog.sql` — expands the remaining seven starter courses into complete Skill Pass tracks with 12 lessons, 12-question assessments, two required projects, certificates, $18.99 draft products, and premium access rules.
- `039_link_skill_pass_lessons.sql` — attaches a reviewed track resource to every authored Skill Pass lesson so all 96 lessons have a learning link as well as an internal guide and practice task.
- `040_ai_assessment_attempts.sql` — stores an immutable per-attempt question snapshot and generation metadata so optional AI-generated assessments can be graded safely without changing the reviewed quiz definitions.

## Apply the schema

```bash
# from the project root, with DATABASE_URL pointing at your database
psql "$DATABASE_URL" -f database/schema/001_init.sql
psql "$DATABASE_URL" -f database/schema/002_seed_skills.sql        # optional
psql "$DATABASE_URL" -f database/schema/003_onboarding.sql
psql "$DATABASE_URL" -f database/schema/004_seed_interests.sql     # optional
psql "$DATABASE_URL" -f database/schema/005_career_skills.sql
psql "$DATABASE_URL" -f database/schema/006_seed_career_skills.sql
psql "$DATABASE_URL" -f database/schema/007_universal_careers.sql
psql "$DATABASE_URL" -f database/schema/008_migrate_existing_careers.sql
psql "$DATABASE_URL" -f database/schema/009_seed_universal_careers.sql
psql "$DATABASE_URL" -f database/schema/010_roadmap.sql
psql "$DATABASE_URL" -f database/schema/011_projects.sql
psql "$DATABASE_URL" -f database/schema/012_daily_missions.sql
psql "$DATABASE_URL" -f database/schema/013_coding_challenges.sql
psql "$DATABASE_URL" -f database/schema/014_progress_tracking.sql
psql "$DATABASE_URL" -f database/schema/015_career_readiness.sql
psql "$DATABASE_URL" -f database/schema/016_portfolio.sql
psql "$DATABASE_URL" -f database/schema/017_password_reset_otps.sql
psql "$DATABASE_URL" -f database/schema/018_fix_career_aliases.sql
psql "$DATABASE_URL" -f database/schema/019_learning_resources.sql
psql "$DATABASE_URL" -f database/schema/020_seed_learning_resources.sql
psql "$DATABASE_URL" -f database/schema/021_roles_and_audit.sql
psql "$DATABASE_URL" -f database/schema/022_courses_and_progress.sql
psql "$DATABASE_URL" -f database/schema/023_assessments.sql
psql "$DATABASE_URL" -f database/schema/024_project_evidence.sql
psql "$DATABASE_URL" -f database/schema/025_evidence_readiness.sql
psql "$DATABASE_URL" -f database/schema/026_career_match_metadata.sql
psql "$DATABASE_URL" -f database/schema/027_automatic_portfolio.sql
```

All files are idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT
EXISTS`, `ON CONFLICT DO NOTHING`, etc.) so they're safe to re-run, and
each can be applied to a database that already has the earlier ones
applied. Nothing here deletes data — `007`–`009` only add tables/columns
and copy (never move or drop) rows out of the Phase 4A tables.

## Entity overview

| Table                        | Purpose                                                        |
|-------------------------------|-----------------------------------------------------------------|
| `users`                       | Account identity: name, email (unique), hashed password.       |
| `profiles`                    | 1:1 with `users` — academic info, current goal, onboarding state, learning preferences. |
| `career_goals`                | A user's free-text career goals over time; `profiles` points at the current one. |
| `interests` / `user_interests`| Global interest catalog + a user's selected interests.         |
| `skills`                      | Global skill catalog. Phase 5A adds `skill_category_id`, `skill_type` (`hard_skill`/`soft_skill`/`tool`), `difficulty` (1–5), `is_active`. |
| `user_skills`                 | Join table: a user's proficiency (0–5) in a given skill.        |
| `skill_categories`            | **(5A)** Broad skill groupings usable across every career type (Technical, Design, Marketing, Business, Communication, Management, Analytical, Research, Productivity, Professional, Creative). |
| `career_categories`           | **(5A)** Technology, Design & Creative, Digital Marketing, Business & Professional, Knowledge & Education. |
| `careers`                     | **(5A)** The canonical career catalog — one row per career, belongs to a category. New careers are addable with a plain `INSERT`, no code change. |
| `career_aliases`               | **(5A)** Free-text variants ("front end engineer") that resolve to a `careers` row — replaces the old hardcoded alias map in `careerMatcher.js`. |
| `career_skills`                | **(5A)** Normalized career ↔ skill requirement: `skill_type` (required/recommended/optional), `min_level`/`target_level` (1–5), `importance`/`priority` (1–3). Successor to `career_skill_requirements`. |
| `career_skill_requirements`   | (Phase 4A, legacy) Flat career-title → skill mapping. Left in place, untouched, as a historical record — no longer read by the backend after Phase 5A. |
| `roadmaps`                    | **(6A)** One row per generated roadmap version for a user; at most one `active` per user. Snapshots `career_title` and `weekly_hours` used at generation time. |
| `roadmap_phases`              | **(6A)** Ordered stages within a roadmap (e.g. Foundations, Strengthen Developing Skills, Apply Your Skills, Validate Readiness). |
| `daily_missions`             | **(7C)** Personalized daily learning/practice/build/review/challenge actions with per-user status. |
| `roadmap_items`               | **(6A)** learning/practice/project/assessment items within a phase, optionally tied to one `skills` row. |
| `learning_resources`          | **(current)** normalized catalog of verified learning resources, each linked to one global `skills` row; roadmap-item recommendations resolve through the existing `roadmap_items.skill_id`. |
| `courses` / `course_prerequisites` | Structured draft/published learning paths linked to existing skills and prerequisite relationships. |
| `course_modules` / `course_lessons` | Ordered content that can reference an existing attributed learning resource or a separately validated HTTPS source. |
| `course_enrollments` / `lesson_progress` | User-owned course state and idempotent lesson completion. |
| `audit_logs` | Append-only records for privileged content changes. |
| `quizzes` / `quiz_versions` | Stable quiz identities with draft, published and retired definition versions. |
| `quiz_questions` / `quiz_options` | Version-owned questions and server-private correctness data. |
| `quiz_attempts` / `quiz_attempt_answers` | User-owned persisted order, exact grading and immutable result history. |
| `project_submissions` / `project_submission_versions` | User-owned project evidence with immutable submitted/reviewed versions. |
| `project_submission_milestones` | Evidence records tied to the existing required project milestones. |
| `project_submission_reviews` / `project_submission_status_history` | Reviewer decisions and append-only workflow history. |
| `evidence_readiness_snapshots` | Reproducible evidence score, algorithm version, component contributions and source evidence. |
| `project_submission_revocations` | Auditable removal of approved evidence from future readiness calculations. |
| `portfolio_evidence_entries` | Private-by-default references to immutable reviewed project versions with separate public presentation controls. |
| `certificate_definitions` / `certificate_required_*` | Configured lesson, quiz, approved-project and evidence-readiness completion requirements. |
| `issued_certificates` / `certificate_status_history` | Immutable issue snapshots, high-entropy public verification codes and append-only issuance/revocation history. |
| `products` / `product_skills` / `product_prices` | Skill access products with integer minor-unit, currency-specific server pricing. |
| `orders` / `order_items` / `payments` | Immutable server-calculated order snapshots and a payment record boundary for the next milestone. |
| `access_grants` / `premium_content_rules` | Permanent user entitlements and server-enforced course, quiz, project and certificate gates. |
| `payment_webhook_events` / `payment_status_history` / `receipts` | Replay-safe signed sandbox events, append-only payment transitions and server-issued receipts. |
| `referral_codes` / `referral_attributions` / `referral_rewards` | Bounded referral attribution and one held/reversible reward per verified paid order. |
| `wallet_ledger` / `withdrawal_requests` / `commission_policies` | Currency-isolated append-only balances, encrypted payout destinations and reviewed withdrawal reservations. |

## How career-goal resolution works (Phase 5A)

A user's career goal is still just free text, stored per-user in
`career_goals`/`profiles` exactly as it was in Phase 2/3 — Phase 5A does
not touch that data. What changed is how the backend turns that free
text into a specific career: `backend/src/utils/careerMatcher.js` now
looks the normalized text up in `career_aliases` (which includes every
career's own title as its own alias) instead of a hardcoded array, so
adding a new career or alias is a database seed, not a code change.

`user_skills` (self-assessment) + the resolved career's `career_skills`
rows are everything skill-gap analysis needs. Results are computed on
demand and never cached, so they're always in sync with the user's
latest profile/skills.
