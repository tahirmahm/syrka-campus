# Syrka Campus

A multi-tenant academic platform. Pilot development includes registration, course delivery, text assignments, timed assessments, marking, attendance, calendars and weighted course results. Hosted institutional acceptance remains pending.

**Pilot milestone; backend provisioning blocked.** Source is in [tahirmahm/syrka-campus](https://github.com/tahirmahm/syrka-campus), public for now at the owner’s request. Supabase rejected dedicated project creation because the account already has two active free projects. See [status](docs/status.md) for current deployment evidence, scope and gaps.

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

No paid APIs are used. Existing Syrka applications and production infrastructure have not been modified.

Run independent-session tests only against an **empty disposable** PostgreSQL 17 database:

```sh
CAMPUS_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/cam_test npm run test:postgres
```

The harness refuses databases with existing public tables and creates test Auth/Storage schemas. Never point it at production. GitHub CI provisions its own PostgreSQL service.
