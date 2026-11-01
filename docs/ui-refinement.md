# Original LMS refinement — Preview only

Baseline verified against production-linked commit 82b020b53a97713740b9f3565a1e04666a4c760b. PR #9 remains separate and unmerged; no replacement dashboard, priority engine, fictional journeys or integration panels are imported.

The dashboard server component, queries and composition are unchanged. Sidebar destinations/order, institution selector, role variants, breadcrumb, existing Workspace link, profile and sign-out are retained. Shared presentation refinements cover cards, metadata, lists, controls and active/focus states. Black/neutral dark appearance defaults for new users; an explicit scoped cookie renders the chosen theme server-side. The toggle stays within the original header; changing it does not navigate, remount forms or alter institution context. Official assets and uploaded media are not inverted.

No database migrations, RLS, authentication, actions, grading, submission or assessment rules are changed. Only this feature branch has public Preview backend configuration for ordinary existing-account sign-in. No private demo credentials are deployed. Production and other applications remain unchanged.

Lint, strict TypeScript build and 18 existing unit/database tests passed. Browser and visual acceptance results are recorded in draft PR #10. Do not merge/promote this branch automatically. Earlier light-only AGENTS.md guidance is superseded by the current user's explicit dual-theme corrective directive.

## Matched visual review

The before screenshots are from production; after screenshots are from the local production build, using the same authorised student demo account and current dataset. Both desktop and mobile themes were visually inspected. All 16 existing responsive/role/accessibility browser checks passed. GitHub CI passed, including PostgreSQL concurrency and setup checks.

- [Before desktop](refinement-screenshots/before-1440-light-dashboard.png) / [After light](refinement-screenshots/after-1440-light-dashboard.png) / [After dark](refinement-screenshots/after-1440-dark-dashboard.png)
- [Before mobile](refinement-screenshots/before-390-light-dashboard.png) / [After light](refinement-screenshots/after-390-light-dashboard.png) / [After dark](refinement-screenshots/after-390-dark-dashboard.png)

Vercel reports the Preview queued in its Hobby concurrent-build queue. Remote Preview acceptance is pending; no paid upgrade or unrelated deployment cancellation is authorised. These local screenshots must not be represented as deployed Preview captures.
