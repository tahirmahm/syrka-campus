# Provisioning and release

## Access blockers

1. Create an empty private `tahirmahm/syrka-campus` GitHub repository and grant the integration access. `gh repo create` returned `Resource not accessible by integration (createRepository)`. No connected browser tool was available as a fallback.
2. Select the Supabase organization explicitly. Existing organization Syrka (`xxwikrftscbssryvcydh`) is Free and already has two active projects. Confirm availability of a third dedicated free project before creation. Do not pause, reuse or delete existing projects to make room.
3. Create `Syrka Campus` only at zero cost in an EU region. If unavailable, report the blocker; never upgrade.
4. Create exactly one Vercel `syrka-campus` project after populating the repository. Import GitHub with main as production; check project names immediately before creation to prevent duplicates.

## Database and auth

Check installed CLI `--help`, link only the new project, and apply versioned migrations. Verify remote migration history. Never target `ejzymrrfyezvdiocwsew` or `zguejzlseldovdssiumn`.

Use email/password Auth. For the institutional pilot disable public signup and provision users through the dashboard's normal password setup flow. Canonical site URL: `https://www.syrka.co/campus`. Self-service invitations and recovery are not yet implemented.

Bootstrap each institution and initial administrator through an operator transaction after creating the Auth account:

```sql
begin;
with institution as (
  insert into public.institutions(name,slug)
  values ('Institution name','institution-slug') returning id
)
insert into public.memberships(institution_id,user_id,role)
select id, '<existing-auth-user-uuid>'::uuid, 'admin' from institution;
commit;
```

Verify the project and intended UUID first. Subsequent academic configuration and role grants use the admin UI. The membership RPC prevents self-modification. Institution creation and initial policy setup are operator tasks in this milestone.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel. No service-role key is needed by this app. Keep preview and production data separate.

Run Supabase security/performance advisors after migration, resolving material findings. Repeat tests using hosted Auth accounts from two institutions. Verify actual Storage API uploads and signed downloads, not only SQL policies.

## Domain integration

Read-only inspection confirmed Vercel project `syrka12` (`prj_1cL7osrSUHKR2FutAhjdHsn3wGcN`) owns www.syrka.co. Its project routes API returned no routes. `tahirmahm/syrka.v12/next.config.mjs` was empty on both main and the inspected default branch. The default branch was `claude/build-syrka-system-DVli3`; do not assume it is deployed. Existing `/workspace/tools` returned HTTP 200 with matched path `/tools`, so inspect the full deployed configuration before changing routes.

Campus builds with `/campus` basePath. Once the actual Campus hostname is verified, merge the following proposed rules into the website configuration, preserving its existing rules and ordering:

```js
{ source: '/campus', destination: 'https://<verified-campus-host>/campus' },
{ source: '/campus/:path*', destination: 'https://<verified-campus-host>/campus/:path*' },
```

These rules are not applied. Never commit a placeholder hostname. Do not strip or duplicate the prefix. Verify direct loads, refresh, RSC navigation, server actions, auth cookies, `/campus/_next/*` and signed file downloads. If proxy origin validation requires configuration, allow only the exact canonical website origin; never wildcard origins.

Test existing `/`, `/workspace`, `/workspace/tools` before and after integration. Prepare a minimal change in the website repository, test it and commit using its normal deployment process. No DNS change is needed. Do not redeploy or alter Workspace.

Verify two successive GitHub pushes produce Vercel deployments with the expected commit SHAs. Production is complete only when www.syrka.co/campus and the full hosted pilot journey pass.

## Remaining release gates

- Independent PostgreSQL session races for last-seat registration, duplicate sections and concurrent academic operations.
- Hosted Auth account setup, refresh, sign-out and Workspace cookie isolation.
- Complete browser student/faculty/admin journey with two institutions.
- Advisors, Storage API verification, file retention and orphan cleanup.
- Accessibility, performance/load testing, recovery and institutional policy configuration.
