# Syrka Campus engineering rules

Read README.md, docs/status.md and docs/operations.md before changes.

## Architecture

- Dedicated Next.js App Router, React, strict TypeScript, Tailwind and Supabase Auth/Postgres/Storage. No paid APIs.
- Production basePath `/cam`. Next Link and next/navigation redirect paths omit the prefix (Next adds it); plain links, API requests and assets include it exactly once. Revalidation uses the actual prefixed path.
- Production source of truth is tahirmahm/syrka-campus (public for now by explicit user instruction on 27 October 2026), main branch. Subsequent development uses feature branches and reviewed PRs where practical.
- Exactly one new Vercel project: syrka-campus. Import from GitHub; use automatic Git deployments, never an independent CLI production deployment.
- No shared identity or database with Workspace. See docs/integrations.md.

## Brand and design

- public/brand contains the user's authoritative source JPGs. Never redraw, reinterpret, stretch or replace them. Preserve black/white identity and clear space.
- Symbol for compact branding and favicon; full wordmark for authentication.
- Light palette: ivory #FAFAF8, white #FFFFFF, cloud #F1F3F5, charcoal #26282B, slate blue #536D91, powder blue #E8EFF8, lavender #EEEAF7, apricot #F7E9DE, border #E2E5E9, muted #606974. Retire green/dark themes.
- Wayfinding clarity, original iconography, serif headings and sans-serif information. Responsive layouts, keyboard access, visible focus, semantic labels and light-only appearance. No WCAG conformance claim without an audit.

## Security

- Every tenant-owned exposed table has RLS. Deny by default. Never add blanket member-write policies.
- Roles come only from memberships, never editable metadata or profiles. Verify active membership and faculty assignment in server actions and database policies.
- Composite foreign keys enforce tenant consistency. A tenant id is not proof of authorization.
- Enrollment, submissions and grades change through scoped transactions. Preserve user/offering locks, deadlines, resubmission limits and publication confidentiality.
- SECURITY DEFINER functions belong in campus_private, use empty search_path, validate auth.uid(), and restrict execute grants. Public RPC wrappers are SECURITY INVOKER.
- Private files only. Signed links expire in 60 seconds. Validate size/type; never serve uploaded HTML or execute uploads.
- No privileged credentials in browser code, commits, logs or documentation. Normal requests use user sessions and the publishable key.
- Audit sensitive operations without duplicating assignment text or file contents.
- Assessment marking keys and attempt snapshots deny direct student access. All attempt writes use transactional RPCs, immutable snapshots and database deadlines. Results are returned only when authorized and published. Schema existence alone is not functionality.

## Verification and deployment

- Run npm run lint, npm test, npm run build and npm run test:browser where applicable.
- PGlite verifies SQL and RLS. Run npm run test:postgres against an EMPTY disposable PostgreSQL database for independent-session registration races. Never target a hosted application database with the test harness. Hosted Auth/Storage still require separate verification.
- Apply migrations only to dedicated Campus Supabase. Never modify Workspace or Syrka.V12 data.
- Free tiers only. Never purchase, upgrade, enable paid addons, pause/delete existing projects or accept nonzero costs.
- Required URL: https://www.syrka.co/cam. A vercel.app URL alone is insufficient.
- Inspect the existing website before integration. Preserve /, /workspace and /workspace/tools. Only a tested minimal Campus proxy change is authorized. Avoid DNS changes.
- Report incomplete features and blockers accurately. No production, advisor, end-to-end or CI claims without observed evidence.

## Hosted backend and demo

- Dedicated Campus project is pftbpimhyophitfuzcxn (EU West 1). Never target the two existing Syrka projects.
- Server-only demo credentials establish normal sessions; verify expected membership and role in the dedicated demonstration institution. Never use a service-role key for normal requests or expose demo passwords through NEXT_PUBLIC variables.
- Praxis Institute is real institutional data; demo/verification institutions are separate. Do not reset or seed real institutions as demonstrations.
- Hosted verification scripts require explicit private operator credential/fixture files and mutate only their own verification records. Keep all such files ignored and out of logs.
- Supabase breached-password protection is a known Pro-only advisor warning; do not upgrade to remove it. Minimum password strength is configured independently.

- Redesign release: light only, no system dark preference or toggle. Use consistent SVG icons, never emoji/text-arrow navigation. Preserve official logo pixels via luminance-mask rendering; do not redraw. Mobile navigation uses an accessible modal drawer, never a scrolling desktop row. See docs/redesign.md.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
