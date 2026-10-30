# Syrka Campus

A multi-tenant academic platform. Pilot development includes registration, course delivery, text assignments, timed assessments, marking, attendance, calendars and weighted course results. Hosted institutional acceptance remains pending.

**Public URL: [www.syrka.co/cam](https://www.syrka.co/cam).** GitHub main deploys to the dedicated Hobby Vercel project; the Syrka website proxies `/cam`. The owner-provided EU Supabase backend is initialized and hosted pilot tests pass. The interface uses a light-only academic design system, responsive role-aware navigation and one-click student/faculty/administrator demo access in a separate sample institution. See [status](docs/status.md) and [verification](docs/deployment-verification.md) for exact release evidence and remaining scope.

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

SQL integration tests execute actual migrations under PostgreSQL-compatible PGlite using authenticated identities in two institutions. Hosted Auth/Storage and the pilot journey have separate verification scripts; independent session races run against disposable PostgreSQL.

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

Hosted pilot browser tests: `CAMPUS_TEST_FIXTURE_PATH=<private fixture> npm run test:hosted`. The fixture and administrator keys must remain outside Git.

Redesign regression checks: `npm run test:redesign` after a configured production build. This uses only read-only demo tours and cancels withdrawal; it does not reset academic records. Set `CAMPUS_BROWSER_BASE_URL=https://www.syrka.co` to verify production and optionally `CAMPUS_SCREENSHOT_DIR=<output directory>` to capture desktop/mobile evidence. See [redesign notes](docs/redesign.md).

Sessions and Notes integration is additive and uses Campus's own session cookies, roles and database. See [provider eligibility, independent identity boundaries, configuration and rollout gates](docs/sessions-notes.md). The associated Workspace UI requires both Git-linked releases; it never shares service-role credentials or assumes shared Auth identities.
