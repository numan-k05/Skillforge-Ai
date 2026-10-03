# Phase 1 implementation plan

Scope: stabilize the existing application only. Preserve database schemas, all 49 seeded skills, page layouts, routes, and existing features. No payments, referrals, certificates, or new product features.

1. Establish baseline frontend lint/build and inspect backend routing, services, models, validation, authentication, and ownership boundaries.
2. Fix unused frontend code, effect dependencies, loading lifecycle defects, and API error handling. Enable React checks in the existing Oxlint toolchain.
3. Harden JWT configuration/verification, safe error responses, CORS, rate limiting, and confirmed validation/transaction defects without changing database architecture.
4. Add secret-free frontend/backend environment examples and essential automated HTTP tests using an isolated database test double; explicitly distinguish these from live PostgreSQL tests.
5. Correct unsupported marketing copy only, including automatic adaptation and repository evaluation claims.
6. Run frontend lint/production build, backend syntax checks and automated tests. Document modified files, evidence, remaining limitations, and reproducible setup commands.

Baseline: frontend React checks report unused imports/catch variable, mixed context/component exports, synchronous loading effects, and four missing effect dependencies. Backend test script is a placeholder. No Git repository or AGENTS.md was found in this workspace. Existing backend .env must remain untouched and undisclosed.
