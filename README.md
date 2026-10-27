# Syrka Campus

A multi-tenant academic platform. This is an initial pilot implementation, not the complete Moodle/Canvas-scale product in the master directive.

**Not deployed.** GitHub repository creation was rejected by the connected integration. The dedicated Supabase backend and GitHub-connected Vercel project have not been provisioned. See [status](docs/status.md) for scope and gaps.

## Development

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000/campus/login. Without backend configuration sign-in is disabled and protected routes redirect to setup; no invented academic data is displayed. Configure only the dedicated Campus project's URL and publishable key. Auth cookies have a separate name and `/campus` scope.

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
- `tests`: SQL authorization and browser setup checks.
- `public/brand`: unmodified official source assets.
- [Operations](docs/operations.md): provisioning, migrations, bootstrap and domain integration.
- [Integration boundaries](docs/integrations.md): Workspace and Passport.

No paid APIs are used. Existing Syrka applications and production infrastructure have not been modified.
