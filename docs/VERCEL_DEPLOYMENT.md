# Vercel deployment: frontend and backend

Deploy this repository as two Vercel projects connected to the same Git repository. Vercel supports multiple projects with different root directories in one monorepo. Keep the frontend and backend on stable HTTPS domains before setting production environment variables.

## Project 1: backend

- Suggested project name: `skillforge-ai-api`
- Root Directory: `backend`
- Framework Preset: Express
- Install Command: `npm ci`
- Build Command: leave empty
- Output Directory: leave empty
- Node.js: 22.x (also declared in `package.json`)
- Suggested production domain: `https://api.example.com`

Set these backend Production environment variables in the Vercel dashboard. Values shown in angle brackets are placeholders and must never be committed.

| Variable | Production value or rule | Required |
| --- | --- | --- |
| `NODE_ENV` | `production` | Yes |
| `DATABASE_URL` | Provider's pooled PostgreSQL connection URL | Yes |
| `DB_POOL_MAX` | `5` | Yes |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true`, unless the database provider explicitly requires `false` | Yes |
| `JWT_SECRET` | Unique random value, at least 32 characters | Yes |
| `JWT_EXPIRES_IN` | `7d` | Yes |
| `CORS_ORIGIN` | Exact frontend origins, comma-separated, with no trailing slash | Yes |
| `PUBLIC_APP_URL` | Exact canonical frontend origin, such as `https://app.example.com` | Yes |
| `OWNER_ADMIN_EMAIL` | Existing owner account email | Yes for owner administration |
| `WALLET_ENCRYPTION_KEY` | Base64-encoded 32-byte random key | Yes for referral payout destinations |
| `TRUST_PROXY_HOPS` | `1` on Vercel | Yes |
| `API_RATE_LIMIT_MAX` | `1200` | Yes |
| `SMTP_HOST` | SMTP provider hostname | Required for password reset |
| `SMTP_PORT` | Usually `587` or provider value | Required for password reset |
| `SMTP_SECURE` | `false` for STARTTLS/587; use provider guidance | Required for password reset |
| `SMTP_USER` | SMTP username | Required for password reset |
| `SMTP_PASS` | SMTP password or API credential | Required for password reset |
| `MAIL_FROM` | Verified sender address | Required for password reset |
| `AI_ENABLED` | `false` until a provider is configured | Optional |
| `AI_ASSESSMENTS_ENABLED` | `false` until reviewed and funded | Optional |
| `AI_API_KEY` | Provider secret key | Only when AI is enabled |
| `AI_API_BASE_URL` | Provider API base URL | Only when AI is enabled |
| `AI_MODEL` | Supported provider model identifier | Only when AI is enabled |
| `AI_TIMEOUT_MS` | `30000` | Optional |
| `AI_MAX_TOKENS` | `1800` | Optional |
| `SANDBOX_PAYMENT_WEBHOOK_SECRET` | Leave unset in production | No |

Do not set `PORT` on Vercel. Do not place backend secrets in any variable beginning with `VITE_`.

For Preview deployments, use a separate preview database and preview secrets. Add the exact preview frontend alias to `CORS_ORIGIN`; do not point untrusted branch previews at the production database.

## Project 2: frontend

- Suggested project name: `skillforge-ai-web`
- Root Directory: `frontend`
- Framework Preset: Vite
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: 22.x (also declared in `package.json`)
- Suggested production domain: `https://app.example.com`

Set these frontend Production environment variables:

| Variable | Production value | Visibility |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.example.com/api` | Public browser configuration |
| `VITE_PUBLIC_SITE_URL` | `https://app.example.com` | Public canonical site origin |

Every `VITE_` value is compiled into browser assets and must be treated as public. The SPA rewrite in `frontend/vercel.json` supports direct navigation to React routes. Generated route HTML, assets, `robots.txt`, and `sitemap.xml` take filesystem precedence over the fallback.

## Secret generation

Run these locally and paste their output directly into Vercel's encrypted environment-variable form. Do not paste the output into source files, chat, tickets, or logs.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use the first value for `JWT_SECRET` and the second for `WALLET_ENCRYPTION_KEY`.

## Production migration

Run migrations from a trusted local checkout or protected CI job, not from a Vercel Function. Back up an existing production database first.

From `backend`, create a temporary untracked `.env.migrate` containing the production values for `DATABASE_URL`, `NODE_ENV=production`, and the provider's `DB_SSL_REJECT_UNAUTHORIZED` setting. Then run:

```powershell
cd backend
$env:DOTENV_CONFIG_PATH = ".env.migrate"
npm ci
npm run db:setup
npm run db:verify
Remove-Item Env:DOTENV_CONFIG_PATH
Remove-Item -LiteralPath .env.migrate
```

The migration runner applies the numbered files in `database/schema` once and records them in `skillforge_schema_migrations`. The current release requires all 46 migrations through `046_seed_pkr_product_prices.sql`.

For a new production database, register the owner through the deployed application, then bootstrap the role from the trusted checkout using the same temporary migration environment:

```powershell
$env:DOTENV_CONFIG_PATH = ".env.migrate"
npm run admin:set-role -- <owner-email> admin --confirm
npm run access:verify-owner
Remove-Item Env:DOTENV_CONFIG_PATH
```

## Deployment order

1. Provision a managed PostgreSQL database with connection pooling.
2. Back up the database if it already contains data.
3. Apply and verify migrations.
4. Create the backend Vercel project with Root Directory `backend`, add its environment variables, and deploy.
5. Verify `https://api.example.com/api/health` and `/api/ready` return HTTP 200.
6. Create the frontend project with Root Directory `frontend`, set its two public variables, and deploy.
7. Update backend `CORS_ORIGIN` and `PUBLIC_APP_URL` with the final frontend domain, then redeploy the backend if the final domain changed.
8. Run the automated live smoke test and complete the authenticated checks below.

## Live smoke tests

Run the read-only automated check from `backend`:

```powershell
$env:LIVE_API_ORIGIN = "https://api.example.com"
$env:LIVE_APP_ORIGIN = "https://app.example.com"
npm run test:live
Remove-Item Env:LIVE_API_ORIGIN
Remove-Item Env:LIVE_APP_ORIGIN
```

It verifies backend health/readiness, public skills and courses, the frontend home page, a direct SPA route, `robots.txt`, and `sitemap.xml`.

Complete these controlled browser checks after that:

1. Register a fresh learner, log out, and log in again.
2. Open `/dashboard` directly in a new tab and confirm the session rules behave as expected.
3. Confirm a learner cannot open `/admin` and receives no Administration navigation.
4. Log in with the owner account and confirm the private Administration entry appears.
5. Open skills, courses, assessments, missions, certificates, store, and My Access.
6. Create a low-risk manual-payment test order without transferring money; verify it remains pending and grants no access.
7. Request a password reset and confirm delivery through the configured SMTP provider.
8. Inspect Vercel Function logs for unhandled errors, database connection exhaustion, CORS failures, and HTTP 429 responses.

Do not use real payment details during deployment testing. Payment screenshots are stored in PostgreSQL, while the application writes no persistent files to the Vercel Function filesystem. The 600 KB screenshot limit stays below Vercel's function payload limit.

The application-level rate limiter is an additional per-instance control. Configure Vercel Firewall rate limiting for production-wide enforcement. The dependency audit currently reports zero known production vulnerabilities after updating the transitive `ip-address` package to its fixed release.
