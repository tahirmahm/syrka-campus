# Syrka Campus engineering rules

Read README.md, docs/status.md and docs/operations.md before changes.

## Architecture

- Dedicated Next.js App Router, React, strict TypeScript, Tailwind and Supabase Auth/Postgres/Storage. No paid APIs.
- Production basePath `/campus`. Next Link and next/navigation redirect paths omit the prefix (Next adds it); plain links, API requests and assets include it exactly once. Revalidation uses the actual prefixed path.
- Production source of truth is tahirmahm/syrka-campus (public for now by explicit user instruction on 27 October 2026), main branch. Subsequent development uses feature branches and reviewed PRs where practical.
- Exactly one new Vercel project: syrka-campus. Import from GitHub; use automatic Git deployments, never an independent CLI production deployment.
- No shared identity or database with Workspace. See docs/integrations.md.

## Brand and design

- public/brand contains the user's authoritative source JPGs. Never redraw, reinterpret, stretch or replace them. Preserve black/white identity and clear space.
- Symbol for compact branding and favicon; full wordmark for authentication.
- Porcelain #F8F9F6, sage #E6EEE8, forest #315B4D, ink #222A27, sand #F3EDE3, gold #D5B875.
- Wayfinding clarity, original iconography, serif headings and sans-serif information. Responsive layouts, keyboard access, visible focus, semantic labels and accessible dark mode. No WCAG conformance claim without an audit.

## Security

- Every tenant-owned exposed table has RLS. Deny by default. Never add blanket member-write policies.
- Roles come only from memberships, never editable metadata or profiles. Verify active membership and faculty assignment in server actions and database policies.
- Composite foreign keys enforce tenant consistency. A tenant id is not proof of authorization.
- Enrollment, submissions and grades change through scoped transactions. Preserve user/offering locks, deadlines, resubmission limits and publication confidentiality.
- SECURITY DEFINER functions belong in campus_private, use empty search_path, validate auth.uid(), and restrict execute grants. Public RPC wrappers are SECURITY INVOKER.
- Private files only. Signed links expire in 60 seconds. Validate size/type; never serve uploaded HTML or execute uploads.
- No privileged credentials in browser code, commits, logs or documentation. Normal requests use user sessions and the publishable key.
- Audit sensitive operations without duplicating assignment text or file contents.
- Future-phase tables currently deny all. Schema existence is not functionality.

## Verification and deployment

- Run npm run lint, npm test, npm run build and npm run test:browser where applicable.
- PGlite verifies SQL and RLS. Run npm run test:postgres against an EMPTY disposable PostgreSQL database for independent-session registration races. Never target a hosted application database with the test harness. Hosted Auth/Storage still require separate verification.
- Apply migrations only to dedicated Campus Supabase. Never modify Workspace or Syrka.V12 data.
- Free tiers only. Never purchase, upgrade, enable paid addons, pause/delete existing projects or accept nonzero costs.
- Required URL: https://www.syrka.co/campus. A vercel.app URL alone is insufficient.
- Inspect the existing website before integration. Preserve /, /workspace and /workspace/tools. Only a tested minimal Campus proxy change is authorized. Avoid DNS changes.
- Report incomplete features and blockers accurately. No production, advisor, end-to-end or CI claims without observed evidence.
