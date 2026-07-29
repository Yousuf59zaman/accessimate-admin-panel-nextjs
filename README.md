# Accessimate Admin Panel

An independently deployed multi-panel CMS built with Next.js, NestJS, Prisma, and PostgreSQL. The application does not depend on any legacy API or database.

## Live reviewer build

- Application: https://accessimate-admin-panel-nextjs.vercel.app
- API health: https://accessimate-admin-panel-api.vercel.app/api/v1/health
- Swagger: https://accessimate-admin-panel-api.vercel.app/api/docs

Use **Open admin reviewer demo** or **Open citizen demo** on the landing page. Public reviewer accounts are intentionally read-only; private owner credentials are never stored in the repository or returned to the browser.

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
- NestJS 11 API with validation, request IDs, rate limiting, Helmet, CORS, and Swagger
- Prisma 6 migrations and production-safe seed workflow
- Neon PostgreSQL database dedicated to this project
- 34 persisted CMS modules with server-side search, filters, pagination, status, permissions, soft delete, and restore
- Recursive database-driven navigation and drag-and-drop menu administration
- Secure image/PDF persistence with size, MIME, and file-signature validation
- Legacy Base64 form compatibility for the existing CMS upload controls
- Live account, content, status, trash, and seven-day activity analytics
- Audit records for owner mutations

Social SSO and real payment-provider transactions are not presented as active features. Their UI/integration packages remain available for future provider configuration.

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

The end-to-end suite uses a real PostgreSQL database and verifies health, both reviewer roles, all 34 CMS list contracts, validation, read-only enforcement, owner CRUD, soft delete/restore, large Base64 asset conversion and delivery, menu DTOs, dashboard analytics, and invalid-session rejection.

## Deployment

The frontend and API are separate Vercel projects. Only the frontend server receives `API_URL_BACKEND`; there is no public backend environment variable in the browser bundle. Runtime secrets and database URLs are configured through Vercel environment settings, while the PostgreSQL database runs on Neon.
