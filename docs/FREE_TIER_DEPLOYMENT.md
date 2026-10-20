# Free-tier deployment checklist

This configuration is intended for a personal, educational, non-commercial MVP. Vercel Hobby does not permit commercial operation. Upgrade or move the deployment before accepting money for Skill Passes, bundles, or subscriptions.

## Free stack

- Frontend: Vercel Hobby project rooted at `frontend`
- Backend: Vercel Hobby project rooted at `backend`
- Database: Neon Free PostgreSQL
- Email: Resend Free SMTP (optional during the first deployment)
- AI: disabled; deterministic roadmaps and reviewed assessments remain available
- Domains: the two free `vercel.app` domains

## 1. Create the Neon database

Create one Neon project. Keep both connection strings:

- Pooled URL: use as `DATABASE_URL` in Vercel.
- Direct URL: use only from a trusted terminal to run migrations.

Apply all migrations from this repository:

```powershell
cd backend
$env:DATABASE_URL = "PASTE_NEON_DIRECT_URL"
npm.cmd run db:setup
npm.cmd run db:verify
Remove-Item Env:DATABASE_URL
```

Do not paste the database URL into a tracked file.

## 2. Create the backend Vercel project

Import this Git repository and use:

- Root Directory: `backend`
- Framework: Express
- Install Command: `npm ci`
- Node.js: `22.x`

Copy the variable names from `backend/.env.vercel-free.example` into Vercel. Replace every `YOUR_` and `GENERATE_` value.

Generate the two private keys locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use the first output as `JWT_SECRET` and the second as `WALLET_ENCRYPTION_KEY`. Do not save or share their output.

Deploy, then check:

```text
https://YOUR-BACKEND.vercel.app/api/health
https://YOUR-BACKEND.vercel.app/api/ready
```

Both endpoints must return HTTP 200 before continuing.

## 3. Create the frontend Vercel project

Import the same Git repository again and use:

- Root Directory: `frontend`
- Framework: Vite
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: `22.x`

Copy and replace the values from `frontend/.env.vercel-free.example`. Deploy the project.

## 4. Connect the final URLs

Return to the backend Vercel project and set:

```env
CORS_ORIGIN=https://YOUR-FRONTEND.vercel.app
PUBLIC_APP_URL=https://YOUR-FRONTEND.vercel.app
```

Redeploy the backend after changing them. The URLs must use HTTPS and must not end with `/`.

## 5. Optional free email

Create a Resend account, verify a sending domain, and fill the `SMTP_*` and `MAIL_FROM` variables from the backend template. Redeploy the backend and test one password-reset request. If SMTP is left unconfigured, the rest of the application can run, but reset messages will not arrive.

## 6. Create the owner

Register the owner account through the deployed frontend. From a trusted terminal, temporarily provide the Neon direct URL and production settings, then run:

```powershell
cd backend
$env:DATABASE_URL = "PASTE_NEON_DIRECT_URL"
$env:NODE_ENV = "production"
$env:JWT_SECRET = "PASTE_THE_SAME_VERCEL_JWT_SECRET"
$env:CORS_ORIGIN = "https://YOUR-FRONTEND.vercel.app"
$env:PUBLIC_APP_URL = "https://YOUR-FRONTEND.vercel.app"
$env:OWNER_ADMIN_EMAIL = "YOUR_REGISTERED_EMAIL"
npm.cmd run admin:set-role -- YOUR_REGISTERED_EMAIL admin --confirm
Remove-Item Env:DATABASE_URL,Env:NODE_ENV,Env:JWT_SECRET,Env:CORS_ORIGIN,Env:PUBLIC_APP_URL,Env:OWNER_ADMIN_EMAIL
```

## Free-mode safety rules

- Keep `AI_ENABLED=false` and `AI_ASSESSMENTS_ENABLED=false`.
- Do not enable sandbox payment secrets in production.
- Do not accept real payments on Vercel Hobby.
- Monitor Neon storage because payment-proof images are stored in PostgreSQL.
- Use Vercel and Neon usage dashboards; free services may pause at their limits.
- Back up important data. Free tiers are not a substitute for a production backup policy.

For production and commercial deployment, follow `docs/VERCEL_DEPLOYMENT.md` and `docs/RELEASE_CHECKLIST.md` instead.
