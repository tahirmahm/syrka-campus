# Syrka Campus

A multi-tenant academic platform. Pilot development includes registration, course delivery, text assignments, timed assessments, marking, attendance, calendars and weighted course results. Hosted institutional acceptance remains pending.

**Deployed at [www.syrka.co/cam](https://www.syrka.co/cam), currently in backend-setup mode.** Source is public for now at the owner’s request. Vercel is connected to GitHub main; the existing Syrka website proxies `/cam` to the dedicated Campus deployment. Supabase rejected dedicated backend creation because the account already has two active free projects. Sign-in and hosted academic operations remain unavailable. See [deployment verification](docs/deployment-verification.md) and [status](docs/status.md).

## Development

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000/cam/login. Without backend configuration sign-in is disabled and protected routes redirect to setup; no invented academic data is displayed. Configure only the dedicated Campus project's URL and publishable key. Auth cookies have a separate name and `/cam` scope.

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:browser
```

SQL integration tests execute actual migrations under PostgreSQL-compatible PGlite using authenticated identities in two institutions. Hosted authentication, Storage API behavior and independent concurrent sessions require dedicated Supabase verification.

- `src/app`: student, faculty and administrator routes.
- `src/lib`: authenticated sessions, validated actions and user-scoped Supabase access.
- `supabase/migrations`: schema, RLS, transactional RPCs and private storage policies.
- `tests`: SQL authorization, independent PostgreSQL race tests and browser setup checks.
- `public/brand`: unmodified official source assets.
- [Operations](docs/operations.md): provisioning, migrations, bootstrap and domain integration.
- [Integration boundaries](docs/integrations.md): Workspace and Passport.

No paid APIs are used. The existing website received only the two authorized Campus proxy rules. Workspace source, databases and DNS remain unchanged.

Run independent-session tests only against an **empty disposable** PostgreSQL 17 database:

```sh
CAMPUS_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/cam_test npm run test:postgres
```

The harness refuses databases with existing public tables and creates test Auth/Storage schemas. Never point it at production. GitHub CI provisions its own PostgreSQL service.

Live unauthenticated routing checks: `npm run test:production`.
