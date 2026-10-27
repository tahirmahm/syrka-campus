# Provisioning and release

## Access blockers

1. GitHub repository now exists and is public at the owner’s explicit request. Do not change visibility without new instructions.
2. Owner selected Syrka organization (`xxwikrftscbssryvcydh`). Cost lookup quoted $0/month, but creation of Syrka Campus in eu-west-1 was rejected because owner tahirmahm has reached the two-active-free-project limit. Do not retry without changed capacity; do not pause, delete, reuse or upgrade existing projects.
3. Hosted migrations, Auth/Storage verification and security advisors remain blocked until a dedicated zero-cost project can be created.
4. Owner authenticated Vercel CLI. The Hobby project `syrka-campus` (`prj_Z0PTqNUtOrCSkmaq7M0ySRbnTB3u`) now exists and is connected to GitHub main. Exactly one Vercel `syrka-campus` project is authorized, directly connected to GitHub main. Check for an existing project before creating. A deployment without backend configuration is setup-only and is not a completed pilot.

## Database and auth

Check installed CLI `--help`, link only the new project, and apply versioned migrations. Verify remote migration history. Never target `ejzymrrfyezvdiocwsew` or `zguejzlseldovdssiumn`.

Use email/password Auth. For the institutional pilot disable public signup and provision users through the dashboard's normal password setup flow. Canonical site URL: `https://www.syrka.co/cam`. Self-service invitations and recovery are not yet implemented.

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

Read-only inspection confirmed Vercel project `syrka12` (`prj_1cL7osrSUHKR2FutAhjdHsn3wGcN`) owns www.syrka.co. Its project routes API returned no routes. The website’s `vercel.json` contains the existing Workspace proxy rules; preserve these exactly. `tahirmahm/syrka.v12/next.config.mjs` was empty on both main and the inspected default branch. The default branch was `claude/build-syrka-system-DVli3`; subsequent deployment inspection confirms the live production source is main commit `476af48f52b4ae0f80dfad9ccf96d1ef1c3b75d3`, with commit message “Route syrka.co/workspace to Syrka Workspace”. Existing `/workspace/tools` returned HTTP 200 with matched path `/tools`, so inspect the full deployed configuration before changing routes.

Campus builds with `/cam` basePath. Once the actual Campus hostname is verified, merge the following proposed rules into the website configuration, preserving its existing rules and ordering:

```js
{ source: '/cam', destination: 'https://<verified-campus-host>/cam' },
{ source: '/cam/:path*', destination: 'https://<verified-campus-host>/cam/:path*' },
```

These rules are not applied. Never commit a placeholder hostname. Do not strip or duplicate the prefix. Verify direct loads, refresh, RSC navigation, server actions, auth cookies, `/cam/_next/*` and signed file downloads. If proxy origin validation requires configuration, allow only the exact canonical website origin; never wildcard origins.

Test existing `/`, `/workspace`, `/workspace/tools` before and after integration. Prepare a minimal change in the website repository, test it and commit using its normal deployment process. No DNS change is needed. Do not redeploy or alter Workspace.

Verify two successive GitHub pushes produce Vercel deployments with the expected commit SHAs. Production is complete only when www.syrka.co/cam and the full hosted pilot journey pass.

## Remaining release gates

- Independent session races for assessment attempt limits and concurrent academic operations; registration races pass.
- Hosted Auth account setup, refresh, sign-out and Workspace cookie isolation.
- Complete browser student/faculty/admin journey with two institutions.
- Advisors, Storage API verification, file retention and orphan cleanup.
- Accessibility, performance/load testing, recovery and institutional policy configuration.
