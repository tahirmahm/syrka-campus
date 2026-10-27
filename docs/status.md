# Verified milestone status — 27 October 2026

The application is deployed at https://www.syrka.co/cam in backend-setup mode. The hosted institutional pilot and full master directive remain incomplete. See [deployment evidence](deployment-verification.md).

## Infrastructure

| Item                  | Observed state                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub                | Existing tahirmahm/syrka-campus cloned successfully, main branch. Public for now by explicit owner instruction; attempted privacy change was denied by integration.                                                   |
| Supabase              | Owner selected Syrka organization. Cost quoted $0/month, but create_project rejected: owner has reached the two-active-free-project limit. No Campus project/reference exists. Existing projects preserved.           |
| Vercel                | CLI authenticated by owner. One Hobby project created: syrka-campus (prj_Z0PTqNUtOrCSkmaq7M0ySRbnTB3u), linked to GitHub main. Git production deployment from main reached READY; live /cam proxy smoke tests passed. |
| Required public URL   | https://www.syrka.co/cam loads the application in backend-setup mode.                                                                                                                                                 |
| Existing applications | Only website Campus proxy rules changed (PR #22). Existing /, /workspace and /workspace/tools verified HTTP 200 in Chromium. No existing databases, Workspace source or DNS changed.                                  |
| Cost                  | No purchases, upgrades, paid APIs or paid infrastructure activated.                                                                                                                                                   |

## Implemented locally

- Next.js App Router, React, strict TypeScript, Tailwind, responsive shell, system/manual dark appearance, labelled forms and keyboard focus.
- Unmodified original wordmark and symbol; source files verified byte-for-byte against the attachments.
- `/cam` basePath, prefixed assets, isolated auth cookie name/path, no-store authenticated responses, Supabase password login/logout and session refresh code.
- Active institution membership resolution, verified institution switch, server role checks and tenant RLS.
- Departments, terms, courses, sections, faculty assignments and registration-window administration; privileged membership grants.
- Searchable catalog, term filter, transactional registration/withdrawal, capacity, waitlists, promotion, prerequisites and duplicate registration checks.
- Course overview, weekly module creation, HTTPS resources, announcements, private syllabus/reading uploads and short-lived signed download route.
- Text assignment drafts/final submissions, server/database deadlines and attempt limits, faculty review, manual grading, published feedback and student grade view.
- Enrollment oversight and audit trail.
- Quizzes/exams: all five question types, timed attempts, attempt limits, randomized ordering, immutable snapshots, save/final submission, automatic marking for objective questions and short answers, manual marking, result publication. Expired attempts finalize only previously saved responses.
- Attendance, course calendars, weighted grading categories/items, final course results and staff CSV export. Student results and attendance remain confidential under RLS.
- Faculty can publish/unpublish existing delivery content. Administrators can enable waitlists when creating offerings.

## Verification

- `npm run lint`: passed.
- Production build with strict TypeScript: passed.
- `npm test`: 12 passing tests (parent journey test plus 11 scenarios) against the actual migrations under PGlite. Covers two institutions, tenant consistency, role escalation prevention, duplicate/capacity/waitlist rules, deadlines, text submission limits, foreign administrator rejection, grade confidentiality, admin oversight, unreleased assessment denial and private course-file policies.
- `npm run test:browser`: 2 passing Chromium tests covering exact basePath redirect behavior, protected route setup behavior, actual wordmark loading and mobile width.
- Browser verification caught and fixed double-prefix redirects. Next navigation redirects must omit the `/cam` prefix because Next.js adds it.
- `npm audit --omit=dev`: 0 reported vulnerabilities.
- Seven migrations successfully loaded by SQL integration tests and independent PostgreSQL. None applied to hosted Supabase.
- Supabase security/performance advisors: not run, because the dedicated project does not exist.
- PR #1 GitHub CI completed successfully. PR #2 /cam release checks and Git deployments completed successfully.

These checks do not establish hosted end-to-end behavior or full WCAG conformance.

## Missing functionality and limitations

- Question-bank editing/import, reusable bank libraries, rubrics and advanced exam accommodations.
- Rubrics, official transcript/academic-history completion and configurable institutional grading scales.
- Student file submissions, rich syllabus editing, editing/removal/reordering of delivery content and rich content editing/reordering.
- Timetable conflict validation, program-specific eligibility and configurable institutional grading/registration policies.
- Self-service institution onboarding/profile administration, account recovery/invitation flows and multi-role membership within one institution (one role per institution currently).
- Catalog/admin lists are bounded to 100/200 records; full pagination/search scalability is pending.
- Generated Supabase database types and more precise query DTOs are pending; strict TypeScript currently uses validated inputs and selected result-shape assertions in places.
- Antivirus/quarantine, orphan upload cleanup, retention/backup policies, rate-limit hardening, full accessibility and load audits.
- Complete hosted student/faculty/admin browser journey.
- Workspace/Passport integrations beyond ordinary external links.

## Next milestones

1. Resolve Supabase free project capacity without altering existing projects or paying; provision the dedicated backend.
2. Apply migrations, generate types, run advisors, verify actual Auth/Storage APIs and race tests. Complete the two-institution hosted pilot journey.
3. Complete assessment engine and academic records with authorization tests.
4. Import the repository into exactly one Vercel project, verify Git automatic deployments, and test the minimal website proxy integration at the mandatory public URL.

## Follow-up verification — current session

- Corrected registration/submission success and error redirects to avoid doubled `/cam` prefixes.
- Re-ran SQL authorization tests: 12 passing; lint and production build passed.
- Re-ran Chromium setup/mobile tests: 2 passing.
- Added PostgreSQL 17 independent-session tests: 5 passing (parent plus 4 races), covering last-seat capacity, duplicate enrollment, competing sections and waitlist placement. Tests observe actual server lock waits before releasing the first transaction.
- CI now includes a disposable PostgreSQL service and the race suite. PR #1 remote lint, SQL, PostgreSQL and build steps passed; browser installation/checks were still running at this documentation update.
- Required public `/cam` returned HTTP 404; existing `/workspace/tools` returned HTTP 200.
- No hosted migrations or security advisors run: dedicated backend creation is blocked by Supabase free project limit.

- Production website inspection identifies `tahirmahm/syrka.v12` main commit `476af48f52b4ae0f80dfad9ccf96d1ef1c3b75d3`, deployed via Git to `syrka12`. No website changes applied; there is no verified Campus origin for a proxy rule.

## /cam release in progress

Owner changed the requested public path to `https://www.syrka.co/cam`. Application base path, asset URLs, private cookie scopes, cache invalidation and browser tests now use `/cam`.

Two new migrations implement assessments and academic records. Fifteen SQL tests pass locally, including assessment secrecy, immutable exam content, expiry behavior, automatic/manual marking, attendance isolation and final-grade publication. Hosted database migrations remain blocked by free project capacity.

## Verified public /cam deployment

Four production Chromium smoke tests pass for public routing, real assets, refresh, mobile width and preserved existing routes. GitHub source and website proxy PRs are merged. The dedicated Vercel project is on Hobby and main is the production branch. No backend variables can be configured until a dedicated Supabase project exists, so sign-in remains disabled. See deployment-verification.md for exact commits and deployment IDs.

## Dedicated backend connection pending

Owner provided project `pftbpimhyophitfuzcxn`. Its Auth API responds successfully; Campus schema is absent. Existing connector credentials lack management permission. Supabase CLI authentication is pending before migrations, advisors, test-account provisioning and production environment activation. The former free-capacity blocker is superseded by access to this newly supplied project.
