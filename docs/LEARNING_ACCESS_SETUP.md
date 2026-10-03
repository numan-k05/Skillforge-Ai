# Learning access and purchase flow

## Learner journey

1. Start Free, create an account, and complete onboarding. Free includes exploration, planning, free resources and previews, and free practice tools.
2. Paid courses, assessments, projects, and certificate programs remain visible with a lock. Unlock links point to a matching product.
3. Choose **Skill Pass** for one skill (PKR 999 once), **Career Bundle** for its listed connected courses (PKR 1,999 once), or **SkillForge Pro Monthly** for 30 days of all published premium content (PKR 649).
4. Review the selected product, included content, exact server price, and certificate requirements. Selecting a card does not create an order.
5. Confirm the selection, transfer the exact amount to the displayed UBL or Easypaisa account, and submit the payment date, transaction reference, amount, and a PNG/JPEG screenshot up to 600 KB.
6. The owner must find the matching credit in the real bank or Easypaisa statement and approve it in **Administration**. A screenshot alone does not grant access. Pending, rejected, or correction-requested submissions keep content locked.
7. After approval, open the selected learning path. It contains only that product's courses, assessments, projects, and certificate programs. Start a course to track progress; select its dashboard focus to keep the next steps together.
8. Use **My access & orders** or the dashboard's unlocked paths to return. Buying one product never grants unrelated products. Free tools and catalog browsing remain available.

Monthly access has no automatic charge. Each approved renewal adds 30 days to the later of the current expiry or approval time. When it expires, premium content locks again while saved progress remains. Certificates are earned after the configured lessons, assessments, reviewer-approved projects, and readiness requirements are met; buying access does not issue a certificate. Career bundles include their listed career certificate, not every individual Skill Pass certificate.

## Update this existing installation

From PowerShell:

```powershell
Set-Location 'C:\Users\dell\OneDrive\Desktop\SkillForge-AI-Complete\skillforge-ai'
npm.cmd run db:setup --prefix backend
npm.cmd run db:verify --prefix backend
```

Migrations `043_manual_payments.sql` and `044_manual_payment_revisions.sql` add private payment submissions and immutable correction history. Migration `045_monthly_subscription.sql` adds expiring access and the 30-day all-access product. They do not remove skills, courses, or progress. All have already been applied to the local database.

Keep existing `.env` files. For a fresh installation only, copy the examples when the corresponding `.env` does not exist:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Set these values locally:

| File | Values |
| --- | --- |
| `backend/.env` | `DATABASE_URL` pointing to your PostgreSQL database; a private `JWT_SECRET`; `NODE_ENV=development`; `PORT=4000`; `CORS_ORIGIN=http://localhost:5173,http://localhost:5174`; `PUBLIC_APP_URL=http://localhost:5174` when using port 5174 |
| `backend/.env` | `OWNER_ADMIN_EMAIL=numanahmad998810@gmail.com`. The matching database user must have role `admin`. The local account is already configured. |
| `frontend/.env` | `VITE_API_BASE_URL=http://localhost:4000/api` |

Run the backend in one terminal:

```powershell
Set-Location 'C:\Users\dell\OneDrive\Desktop\SkillForge-AI-Complete\skillforge-ai\backend'
npm.cmd run dev
```

Run the frontend in another terminal:

```powershell
Set-Location 'C:\Users\dell\OneDrive\Desktop\SkillForge-AI-Complete\skillforge-ai\frontend'
npm.cmd run dev -- --port 5174 --strictPort
```

Open `http://localhost:5174`. Restart the backend after changing environment variables. To see Free locks, use a normal learner account without administrative or legacy access grants. Existing privileged grants intentionally remain valid.

The configured payment destinations are Easypaisa `03425550880` and UBL account number `1808371176838`, both titled Numan Ahmad. The UBL value is displayed as an account number, not as an IBAN. Change these from **Administration → Payment accounts and PKR prices** if needed. Never enter a PIN, OTP, password, or secret key there.

To promote the owner on a fresh database after registering that email:

```powershell
npm.cmd run admin:set-role --prefix backend -- numanahmad998810@gmail.com admin --confirm
```

Only the configured owner email with the current database role `admin` can open administration or approve a payment. The check is enforced by the backend on every request; changing a browser token or manually typing `/admin` cannot grant access.

## Verification commands

Run from the project root:

```powershell
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
npm.cmd test --prefix frontend
npm.cmd run check:syntax --prefix backend
npm.cmd test --prefix backend
npm.cmd run db:verify --prefix backend
npm.cmd run test:purchase-flow --prefix backend
npm.cmd run test:manual-payments --prefix backend
npm.cmd run test:e2e --prefix frontend -- e2e/purchase-flow.e2e.js e2e/manual-admin.e2e.js
```

The purchase API verification uses a real local PostgreSQL connection, a temporary HTTP server, and an outer rollback transaction. Test users, purchases, access grants, enrollments, and assessment attempts are rolled back; PostgreSQL sequences can advance. It refuses non-local database hosts. Browser tests use synthetic API fixtures and cover desktop, tablet, and mobile sizes.

Validated on 2026-09-29: frontend lint and production build passed; 18 frontend unit tests passed; backend syntax checks passed for 164 JavaScript files; 75 backend tests passed; database verification passed; 60 database-backed manual-payment and subscription API checks passed; all 21 targeted browser checks passed on desktop, tablet, and mobile. The API checks cover owner-only access, spoofed-email denial, private screenshots, exact amounts, rejection and correction, duplicate reference/proof prevention, sandbox denial, receipts, product-scoped permanent grants, monthly renewal, and expiry enforcement.

## Modified areas

- Commerce catalog models/services expose included content, active access, and checkout availability.
- Shared content-access metadata powers course, assessment, project, and certificate locks.
- Public catalogs support optional JWT authentication for personalized access labels.
- Pricing and store links lead to product selection, review, manual payment submission, and a dedicated product learning page.
- Dashboard and purchases show owned learning paths; course focus filters projects by selected skill and active grants.
- Login, signup, and onboarding preserve the selected destination.
- The owner dashboard manages payment accounts, PKR prices, private proof review, corrections, rejection, and approval. Approval atomically creates the paid record, receipt, and product-scoped grant.
- Admin navigation and routes require the configured owner email plus the live database admin role. Ordinary users and other admin-role accounts cannot access this dashboard.
- Assessment attempts check current access even when an attempt already exists.
- Migration and database verification publish and check all eight Skill Passes and five Career Bundles.
- Automated API and browser verification cover the changed flow.

Manual-payment files added: `backend/src/routes/manualPaymentRoutes.js`, `backend/src/middleware/ownerAdmin.js`, `backend/scripts/verifyManualPaymentFlow.js`, `frontend/src/pages/app/ManualPaymentsAdmin.jsx`, `frontend/src/services/manualPaymentService.js`, `frontend/src/components/auth/OwnerRoute.jsx`, `frontend/e2e/manual-admin.e2e.js`, and migrations `043_manual_payments.sql` and `044_manual_payment_revisions.sql`.

Existing files updated: the commerce and payment models/services; course, assessment, project, and certificate services; the dashboard model; optional-auth middleware and catalog routes/controllers; the store, pricing, checkout, payment-result, purchases, dashboard, course, assessment, project, and certificate pages; login/signup/onboarding navigation; shared navigation and project cards; related frontend API services/styles; database verification; backend package scripts; course and browser test fixtures; Playwright configuration; and the private local backend environment.

## Operational limits

This is a manual transfer workflow. It does not query UBL or Easypaisa, so the owner must verify every credit outside SkillForge before approval. Monthly access is manually renewed and does not charge automatically. Refunds and referral withdrawals remain manual operational actions. Automated international card collection, recurring charges, chargebacks, tax calculation, and automatic payouts are not implemented. Annual and lifetime pricing cards remain unchanged and unavailable.
