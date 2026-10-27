# Deployment verification — 27 October 2026

## Public deployment

- Requested URL: https://www.syrka.co/cam (owner changed from /campus).
- Campus: Hobby Vercel project `syrka-campus`, ID `prj_Z0PTqNUtOrCSkmaq7M0ySRbnTB3u`.
- GitHub source: https://github.com/tahirmahm/syrka-campus, main.
- Verified Git production deployment: `dpl_F6RicgPL43EoNy6WNurRprMxkTns`, source main commit `dd83aacf2cb6cda9ed78504eb0a4add32dd46276`.
- Website proxy: https://github.com/tahirmahm/syrka.v12/pull/22, merged as `5cbae7ef2f97a0bcc1d2626ae4a5f2041fc95f14`. Website Git deployment `dpl_3qQySLRSkzfmQoSeCADUsRJBTzfL` reached READY.
- Exactly two rewrite rules added to the existing website. Existing Workspace rules and cron configuration preserved. No DNS or Workspace repository changes.
- Four live Chromium smoke tests passed: actual logo/assets, direct Campus routes and refresh, mobile width, and existing /, /workspace and /workspace/tools.
- These are unauthenticated routing/setup tests. They do not establish a working hosted academic pilot.

## Backend blocker

Supabase quoted $0/month but rejected creating Syrka Campus in eu-west-1: owner tahirmahm has reached the two-active-free-project account limit. No dedicated project reference exists. Both existing projects remain unchanged.

The application consequently shows its backend-setup notice and disables sign-in. Protected routes redirect to `/cam/login?notice=setup`. This is intentional fail-closed behavior, not a functioning sign-in flow. No fake course or student records are displayed.

Seven migrations pass local SQL integration tests and independent PostgreSQL startup. Hosted migrations, Auth/Storage API verification, security advisors and the full institutional browser journey remain outstanding. An attempted local Supabase stack could not start because a container image failed to extract with `no space left on device`; the successful PostgreSQL tests used the smaller independent PostgreSQL 17 container.

## Application checks

- 15 SQL tests (parent plus 14 scenarios): two-institution journey, role restrictions, tenant consistency, registration, assignments, grade confidentiality, private-file SQL policies, timed assessments, immutable snapshots, marking, expiry, attendance/calendar and final results.
- 5 independent PostgreSQL tests (parent plus 4 race scenarios): last-seat capacity, duplicate registration, competing sections and waitlists.
- 2 local Chromium tests: setup redirects and mobile login.
- 4 production Chromium tests: proxy, assets, direct routes/refresh, mobile and preservation of existing website routes.
- Lint and strict production build passed. PR #2 GitHub CI completed successfully and Vercel deployed from Git.

Run `npm run test:production` to repeat the unauthenticated live smoke tests. They target the canonical website and create no academic records.

## New backend supplied by owner

Owner supplied dedicated project reference `pftbpimhyophitfuzcxn` and its publishable key. The public Auth settings endpoint returns HTTP 200 with email authentication enabled. The Campus institutions endpoint returns PGRST205: schema not yet applied. The connected Supabase account cannot manage this project; a new CLI authentication is pending. Connection settings are saved only in ignored `.env.local`. Production variables are not activated before schema/security initialization.
