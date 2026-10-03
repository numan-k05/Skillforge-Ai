# Deployment and release runbook

For the two-project Vercel configuration, environment-variable inventory, migration commands, and live smoke tests, use [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

## Required services and secrets

- Node.js 22 LTS, PostgreSQL 16 or newer, and an HTTPS reverse proxy.
- Set every value documented in `backend/.env.example`; use independently generated JWT, webhook, database and wallet-encryption secrets.
- Set `NODE_ENV=production`, the exact HTTPS `CORS_ORIGIN` and `PUBLIC_APP_URL`, the deployment's exact `TRUST_PROXY_HOPS`, and the provider-required database TLS policy.
- Build the frontend with its public `VITE_API_BASE_URL`. Never place secrets in a `VITE_` variable.

## Release procedure

1. Back up PostgreSQL and verify the resulting archive before changing the application.
2. Install from lockfiles with `npm ci` in `backend` and `frontend`.
3. Run `npm run db:setup` and `npm run db:verify` from `backend`.
4. Run backend syntax/tests and frontend lint/tests/build. Run Playwright against the release candidate.
5. Deploy the backend and the immutable `frontend/dist` output.
6. Confirm `/api/health` returns `200` and `/api/ready` returns `200` through the public load balancer.
7. Verify registration, login, logout, password reset delivery, one free learning flow, and administrator access with controlled accounts.
8. Monitor structured logs and HTTP error/latency rates. Roll back the application if error rates regress; do not reverse an additive migration blindly.

Production payment activation requires approved merchant credentials, verified provider documentation, real signed-webhook tests and an owner-approved refund policy. Legal pages require owner/legal approval before release.

## Rollback

Deploy the previous application artifact first. The migrations are additive, so leave them in place unless a reviewed migration-specific reversal has been tested against a restored copy. Restore the database only for confirmed data corruption, using the procedure in `BACKUP_RESTORE.md`.
