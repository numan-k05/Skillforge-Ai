# SkillForge AI

**Turn your current skills into your future career.**

SkillForge AI is a React/Vite and Node.js/Express career-development platform for students. It includes JWT authentication, onboarding, career exploration, skill-gap analysis, AI-assisted roadmaps, projects, missions, coding challenges, progress tracking, career readiness, and a public portfolio.

## Production status

Phase 1 stabilization is implemented. Frontend lint/build and isolated automated tests pass; live PostgreSQL migrations, SMTP delivery, and configured AI-provider behavior still require environment verification. See [PHASE_1_REPORT.md](PHASE_1_REPORT.md) for changes, limitations, and exact setup instructions.

Milestones 2–13 are implemented in development. Account settings include privacy preferences, public-profile permission, a safe JSON export and reauthenticated deletion. Public `/privacy`, `/terms` and `/refunds` pages retain owner-review placeholders until legal identity, jurisdiction and production merchant policy are supplied. Production acceptance remains Milestone 14.

Milestone 14 development acceptance is also implemented: clean-database rehearsal, database verification, CI configuration, readiness checks, redacted structured request logging, responsive browser coverage and production runbooks. Public launch still requires the external approvals and infrastructure checks listed in `docs/RELEASE_CHECKLIST.md`.

## Tech stack

- Frontend: React 19, Vite, React Router, CSS, lucide-react, recharts
- Backend: Node.js, Express 5, PostgreSQL (`pg`), JWT, bcryptjs, Zod
- Security: Helmet, CORS allowlist, rate limiting, ownership checks
- Database: PostgreSQL 14+

## Project structure

```text
SkillForge AI/
├── frontend/                 React + Vite application
├── backend/                  Express API
│   ├── src/
│   └── scripts/setupDatabase.js
├── database/schema/          Numbered SQL migrations
├── README.md
└── .env.example              Frontend environment example
```

## Prerequisites

- Node.js 22.12+ (the installed Vite toolchain requires Node 20.19+ or 22.12+)
- npm 9+
- PostgreSQL 14+ (local or managed)

## Local setup

### 1. Configure the frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

The frontend defaults to `http://localhost:4000/api` when `VITE_API_BASE_URL` is not set.

### 2. Configure the backend

Open a second terminal:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set at least:

- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — a long, unique random secret
- `CORS_ORIGIN` — frontend URL(s), comma-separated

Then install, migrate, and run:

```powershell
npm.cmd install
npm.cmd run db:setup
npm.cmd run dev
```

The backend runs on `http://localhost:4000` by default. Health check:

```text
GET http://localhost:4000/api/health
```

## Environment variables

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

For production, this must be the public backend API URL, including `/api`:

```env
VITE_API_BASE_URL=https://api.example.com/api
```

> Vite exposes only variables prefixed with `VITE_` to browser code. Never put JWT secrets, database credentials, or AI API keys in the frontend environment.

### `backend/.env`

See `backend/.env.example`. Important production settings:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=<paste-a-generated-random-secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://app.example.com
PUBLIC_APP_URL=https://app.example.com
SANDBOX_PAYMENT_WEBHOOK_SECRET=
WALLET_ENCRYPTION_KEY=
DB_SSL_REJECT_UNAUTHORIZED=true
```

`JWT_SECRET` must be a unique random value of at least 32 characters in every environment. `CORS_ORIGIN` supports multiple origins separated by commas. Do not commit `.env` files.

Roadmap generation uses the built-in deterministic engine unless `AI_ENABLED=true` and a server-side provider key is configured. Assessment generation is controlled separately. To prepare a new AI-generated question set for each new attempt, configure only the backend:

```env
AI_ASSESSMENTS_ENABLED=true
AI_API_KEY=<provider-key-from-your-secret-manager>
AI_API_BASE_URL=https://api.anthropic.com
AI_MODEL=claude-sonnet-4-6
```

Never place the provider key in a `VITE_` variable. Without a key, or when the provider fails or returns invalid questions, assessments use the reviewed 12-question bank and label the attempt as reviewed or fallback. The server persists each generated set with the attempt, keeps correct-answer markers out of API responses and account exports until grading, and limits assessment starts to 30 per authenticated user per hour.

## Database migrations

The canonical migration command is:

```powershell
cd backend
npm.cmd run db:setup
```

`backend/scripts/setupDatabase.js`:

1. Reads `database/schema/`
2. Selects numbered `.sql` files
3. Sorts them in numeric order
4. Records applied filenames in `skillforge_schema_migrations`
5. Applies only migrations not already recorded

Current migrations run from `001_init.sql` through `040_ai_assessment_attempts.sql`. Migration `040` adds immutable per-attempt question snapshots and generation metadata without replacing the reviewed quiz definitions. Do not rename or reorder existing migrations. Add future changes as new higher-numbered files.

After migrations are applied, an operator with database credentials can grant the content-author role to an existing account:

```powershell
cd backend
npm.cmd run admin:set-role -- author@example.com content_admin --confirm
```

The command requires an explicit `--confirm`, accepts only the defined roles, and records the change in `audit_logs`. Content authoring is available at `/course-admin`; normal learner accounts receive a server-side 403 response.

## Production deployment

### Backend

Deploy the `backend/` directory to a Node.js host.

Build/install command:

```text
npm ci
```

Start command:

```text
npm start
```

Before starting production:

1. Set all required backend environment variables in the host's secret manager.
2. Set `NODE_ENV=production`.
3. Use a managed PostgreSQL `DATABASE_URL`.
4. Run `npm run db:setup` once during release/deployment (or as an explicit migration job).
5. Set `CORS_ORIGIN` to the exact deployed frontend origin(s).
6. Keep `DB_SSL_REJECT_UNAUTHORIZED=true` unless the database provider explicitly requires otherwise.

### Frontend

Deploy the `frontend/` directory as a Vite application.

Install/build commands:

```text
npm ci
npm run build
```

Output directory:

```text
dist
```

Set `VITE_API_BASE_URL` **at build time** to the public backend URL ending in `/api`. Rebuild the frontend whenever this value changes.

### Example production pairing

```text
Frontend: https://app.example.com
Backend:  https://api.example.com
API URL:  https://api.example.com/api
```

Use:

```env
# frontend/.env
VITE_API_BASE_URL=https://api.example.com/api

# backend/.env
CORS_ORIGIN=https://app.example.com
```

## Verification commands

Run `npm.cmd test` in both `frontend/` and `backend/`. Backend tests use an isolated database substitute and do not access your configured PostgreSQL database. Run `npm.cmd run check:syntax` in `backend/` for all backend source, script, and test files.

Responsive browser checks use Playwright and an isolated API fixture. On Windows, point the suite at an installed Chrome executable if Playwright Chromium is not installed:

```powershell
cd frontend
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm.cmd run test:e2e
```


Backend syntax verification:

```powershell
Get-ChildItem backend/src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Frontend lint/build (after dependencies are installed):

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Backend startup:

```powershell
cd backend
npm.cmd start
```

## Security notes

- Keep `.env` files and secrets out of Git and archives.
- Use a unique, strong `JWT_SECRET` in every production environment.
- Never expose `DATABASE_URL`, JWT values, or AI keys to the frontend.
- Configure exact frontend origins in `CORS_ORIGIN`.
- Public portfolio APIs expose only intentionally approved fields.
- Existing private routes remain protected by JWT middleware and ownership checks.

## Distribution guidance

When packaging the project, include source, database migrations, README, package files, and environment templates. Exclude `node_modules`, real `.env` files, secrets, build output, and caches.

## Phase 11C public pages

The marketing experience now includes dedicated routes:

- `/explore` — connected platform overview
- `/how-it-works` — end-to-end workflow
- `/skill-intelligence` — skill analysis and prioritization overview
- `/roadmaps` — roadmap workflow overview
- `/platform` — existing platform page, preserved for compatibility
- `/pricing` — current free offering and future plan concepts

These public routes are separate from protected application routes such as `/skill-analysis` and `/roadmap`.
