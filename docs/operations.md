# Operations

## Targets and cost

Campus source is tahirmahm/syrka-campus, main. Its sole Vercel project is `syrka-campus` (`prj_Z0PTqNUtOrCSkmaq7M0ySRbnTB3u`), Hobby, GitHub-connected. Public URL: https://www.syrka.co/cam.

Dedicated Supabase project: `pftbpimhyophitfuzcxn`, eu-west-1, supplied by the owner. Never apply Campus migrations to `ejzymrrfyezvdiocwsew` or `zguejzlseldovdssiumn`. Preserve zero-cost infrastructure; no upgrades/add-ons.

## Migrations and configuration

Eight version-controlled migrations are applied and recorded in `supabase_migrations.schema_migrations`. TCP connections from this environment were refused. The CLI's HTTPS Management API query path was used to apply each migration and its exact filename/version history within a transaction. The CLI's unused database-connection preflight required a resolver-only placeholder; that value was never used to authenticate to PostgreSQL. Do not mistake it for a database credential.

Authenticate the CLI deliberately, link the exact project, inspect history before applying new migrations and never reapply existing versions. CLI `--help` is the command reference. Run security/performance advisors after schema changes. `supabase/config.toml` declares only intended auth/storage settings; undeclared settings must remain unchanged.

Public Vercel variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No privileged database key is required by normal app requests. Preview deployments intentionally do not inherit production academic credentials.

Auth site URL is https://www.syrka.co/cam. Public signup is disabled while the email/password provider remains enabled. Password requirements are 12 characters with lowercase, uppercase, digits and symbols. Supabase's leaked-password protection requires Pro, so it remains disabled under the free-tier policy.

## Accounts and institutions

Praxis Institute and the owner-approved administrator were bootstrapped through authenticated operator access. Account creation uses the Auth Admin API; membership roles are database records, never user metadata. One-time setup links use `/cam/auth/confirm?type=recovery&token_hash=...`, establish a normal session, then route to `/cam/account/password`. Never put setup tokens or generated passwords in Git, issue bodies or shared logs.

To bootstrap future institutions, create the Auth identity through an authorized account workflow, then insert the institution and initial administrator in one scoped transaction. Subsequent roles use the administrator UI. There is no public self-service role-elevation endpoint.

## Demonstration campus

The demonstration institution is separate from Praxis Institute and contains clearly labelled sample records. Student, faculty and administrator demo buttons establish ordinary Supabase sessions. The server verifies that each configured demo identity has the expected active role in `CAMPUS_DEMO_INSTITUTION_ID` before redirecting.

`CAMPUS_DEMO_{STUDENT,FACULTY,ADMIN}_{EMAIL,PASSWORD}` and the demo institution ID are server-only settings. Passwords must never use NEXT_PUBLIC prefixes. The provisioning script deliberately refuses to overwrite an existing demo institution. Shared demo records can change as visitors explore; do not enter private information there. An authorized operator can provision/reset demo content separately from real institutional data.

## Verification

- `npm test`, `npm run lint`, `npm run build`, `npm run test:browser`.
- `npm run test:postgres`: only an empty disposable PostgreSQL database, via `CAMPUS_TEST_DATABASE_URL`.
- `python tests/hosted/verify.py`: explicitly creates isolated verification institutions and test Auth users in the dedicated backend. It requires ignored `.env.local` and `CAMPUS_TEST_ADMIN_KEYS_FILE`, an operator-created Supabase CLI api-keys JSON file. Never run automatically against an unrelated project or commit the keys file.
- `npm run test:hosted`: requires the private verification fixture path in `CAMPUS_TEST_FIXTURE_PATH`. Uses the local built app by default, or `CAMPUS_BROWSER_BASE_URL=https://www.syrka.co` for live production checks. These tests mutate only verification/demo records.
- `npm run test:production`: read-only public routing/mobile tests; no academic writes.

## Website proxy

`tahirmahm/syrka.v12/vercel.json` contains two `/cam` rules targeting `https://syrka-campus.vercel.app/cam` with the prefix retained exactly once. Preserve existing Workspace rules, cron entries, `/`, `/workspace` and `/workspace/tools`. No DNS change is needed. Do not independently redeploy Workspace.

Campus uses `/cam` basePath. Next Link/next-navigation destinations omit the prefix; plain asset/download URLs, cache invalidation and cookie paths include it. Test direct loads, refresh, server actions and downloads through the canonical website after releases. GitHub main remains production's source of truth.

Shared demonstration passwords, email identities and membership roles are protected by an operator-managed private registry and database triggers. Visitors can explore academic workflows without disabling the shared demo logins. Operators must deliberately unregister those protections before rotating demo credentials.
