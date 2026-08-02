# Accessimate Admin Panel

An independently deployed multi-panel CMS built with Next.js, NestJS, Prisma, and PostgreSQL. The application does not depend on any legacy API or database.

## Live reviewer build

- Application: https://accessimate-admin-panel-nextjs.vercel.app
- API health: https://accessimate-admin-panel-api.vercel.app/api/v1/health
- Swagger: https://accessimate-admin-panel-api.vercel.app/api/docs

Use **Open admin reviewer demo** or **Open citizen demo** on the landing page. Public reviewer accounts are intentionally read-only; private owner credentials are never stored in the repository or returned to the browser.

The separate public guest route is available at `https://accessimate-admin-panel-nextjs.vercel.app/accessibility-widget`. It ports the Accessimate standalone widget from Express `dev` commit `c76c4abb49b3753fd201ea5bff794dc6a30adcd1`, with narrowly scoped same-origin configuration, PostgreSQL persistence/restoration, and lazy third-party translation loading for the new deployment. The original repository remains unchanged.

## Implemented architecture

```text
Browser
  -> same-origin Next.js route handlers
  -> role-specific HttpOnly session cookie
  -> NestJS REST API
  -> Prisma ORM
  -> independent PostgreSQL database
```

- Next.js 16 App Router and React 19 frontend
- Filewise guest/admin/citizen access checks in route-group layouts
- Same-origin BFF that keeps JWTs out of client JavaScript and API responses
- Separate admin and citizen authentication journeys
- Separate public route group with the original Accessimate widget view and no admin/citizen session requirement
- NestJS 11 API with validation, request IDs, rate limiting, Helmet, CORS, and Swagger
- Prisma 6 migrations and production-safe seed workflow
- Neon PostgreSQL database dedicated to this project
- 34 persisted CMS modules with server-side search, filters, pagination, status, permissions, soft delete, and restore
- Recursive database-driven navigation and drag-and-drop menu administration
- Secure image/PDF persistence with size, MIME, and file-signature validation
- Legacy Base64 form compatibility for the existing CMS upload controls
- Live account, content, status, trash, and seven-day activity analytics
- Audit records for owner mutations
- Original `/api/cache/*` and typo-preserved `/api/customer/validete` widget contracts backed by PostgreSQL sessions and account/origin validation
- Responsive citizen workspace for websites, audits, findings, embed code, developer resources, PDFs, billing records, and account settings
- Owner-scoped citizen website CRUD, profile/password updates, PDF submission/download, support requests, and read-only reviewer enforcement
- Server-side WCAG scanner with multi-page discovery, issue recommendations, persisted history, strict response limits, and SSRF/private-network protection
- Account-bound public accessibility widget with text scaling, high contrast, link highlighting, keyboard interaction, and an executable preview
- Persisted subscription, invoice, and payment-ledger views backed by the dedicated PostgreSQL database

Social SSO and real payment-provider transactions are not presented as active features. Their UI/integration packages remain available for future provider configuration.

## Citizen workspace

The citizen journey follows the original Nuxt panel's information architecture while using original Next.js components and the independent NestJS API:

- `/dashboard` — account metrics, latest scan, entitlement, and website management
- `/audit` — protected live scans, WCAG options, history, and finding reports
- `/accessibility` — category-level findings, score, severity, and recommendations
- `/embeded-code` — account-bound installation script and running widget preview
- `/developer-resourse` — live API catalog, base URL, API key, Swagger, and integration example
- `/document-pdf` — validated PDF submission, persisted status, protected download, and support requests
- `/billing-payments` — current subscription, invoices, and payment history
- `/settings` — profile, image, country, password, and developer credentials

The spelling of the two legacy-compatible paths is preserved so existing Nuxt links continue to work.

## Repository structure

```text
app/                       Next.js routes, role layouts, components, BFF, auth contexts
backend/src/               NestJS modules, guards, services, controllers
backend/prisma/            PostgreSQL schema, migrations, seed
backend/test/              PostgreSQL end-to-end API suite
public/                    Static application assets
vercel.json                Frontend deployment configuration
backend/vercel.json        API deployment configuration
```

## Local setup

Requirements: Node.js 20 or newer and pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
```

Copy the sanitized examples and provide local values:

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Initialize the independent database:

```bash
pnpm --dir backend prisma:migrate:deploy
pnpm --dir backend prisma:seed
```

Production seeding requires `OWNER_ADMIN_LOGIN_ID`, `OWNER_ADMIN_EMAIL`, and a strong `OWNER_ADMIN_PASSWORD`. Reviewer accounts use dedicated one-click demo endpoints and cannot mutate data.

Run the API and frontend in separate terminals:

```bash
pnpm --dir backend dev
pnpm dev
```

## Quality gates

```bash
pnpm typecheck
pnpm lint
pnpm build

pnpm --dir backend typecheck
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:e2e
pnpm --dir backend build
```

The end-to-end suite uses a real PostgreSQL database and verifies health, both reviewer roles, all 34 CMS list contracts, validation, read-only enforcement, owner CRUD, soft delete/restore, large Base64 asset conversion and delivery, menu DTOs, dashboard analytics, citizen ownership boundaries, citizen resources, protected PDFs, account updates, public widget delivery, and invalid-session rejection.

## Deployment

The frontend and API are separate Vercel projects. Only the frontend server receives `API_URL_BACKEND`; there is no public backend environment variable in the browser bundle. Runtime secrets and database URLs are configured through Vercel environment settings, while the PostgreSQL database runs on Neon.
