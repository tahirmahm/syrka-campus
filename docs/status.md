# Verified milestone status — 27 October 2026

This is an initial local pilot implementation. The full master directive and production acceptance criteria are not complete.

## Infrastructure

| Item                  | Observed state                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub                | Repository creation attempted; integration denied createRepository. No new remote repository created and no push completed. Target: private tahirmahm/syrka-campus, main.                                                            |
| Supabase              | Organization and projects inspected read-only. Organization selection requested and pending. Existing Syrka organization is Free with two active projects. No Campus project/reference exists; free capacity has not been confirmed. |
| Vercel                | Projects and website ownership inspected read-only. No Campus project created, no deployment performed, no automatic deployments verified.                                                                                           |
| Required public URL   | https://www.syrka.co/campus is not deployed by this work.                                                                                                                                                                            |
| Existing applications | No repository, database, domain or deployment changed. Existing /workspace/tools returned HTTP 200 during inspection.                                                                                                                |
| Cost                  | No purchases, upgrades, paid APIs or paid infrastructure activated.                                                                                                                                                                  |

## Implemented locally

- Next.js App Router, React, strict TypeScript, Tailwind, responsive shell, system/manual dark appearance, labelled forms and keyboard focus.
- Unmodified original wordmark and symbol; source files verified byte-for-byte against the attachments.
- `/campus` basePath, prefixed assets, isolated auth cookie name/path, no-store authenticated responses, Supabase password login/logout and session refresh code.
- Active institution membership resolution, verified institution switch, server role checks and tenant RLS.
- Departments, terms, courses, sections, faculty assignments and registration-window administration; privileged membership grants.
- Searchable catalog, term filter, transactional registration/withdrawal, capacity, waitlists, promotion, prerequisites and duplicate registration checks.
- Course overview, weekly module creation, HTTPS resources, announcements, private syllabus/reading uploads and short-lived signed download route.
- Text assignment drafts/final submissions, server/database deadlines and attempt limits, faculty review, manual grading, published feedback and student grade view.
- Enrollment oversight and audit trail.
- Versioned schema includes future programs, quizzes, questions, answers, attempts, categories, attendance and calendar tables. These future-phase tables deny all access and are not completed features.

## Verification

- `npm run lint`: passed.
- Production build with strict TypeScript: passed.
- `npm test`: 12 passing tests (parent journey test plus 11 scenarios) against the actual migrations under PGlite. Covers two institutions, tenant consistency, role escalation prevention, duplicate/capacity/waitlist rules, deadlines, text submission limits, foreign administrator rejection, grade confidentiality, admin oversight, unreleased assessment denial and private course-file policies.
- `npm run test:browser`: 2 passing Chromium tests covering exact basePath redirect behavior, protected route setup behavior, actual wordmark loading and mobile width.
- Browser verification caught and fixed double-prefix redirects. Next navigation redirects must omit the `/campus` prefix because Next.js adds it.
- `npm audit --omit=dev`: 0 reported vulnerabilities.
- Five migrations successfully loaded by SQL integration tests. None applied to hosted Supabase.
- Supabase security/performance advisors: not run, because the dedicated project does not exist.
- GitHub CI workflow authored but not executed remotely.

These checks do not establish hosted end-to-end behavior, full WCAG conformance or independent multi-session PostgreSQL concurrency safety.

## Missing functionality and limitations

- Full quizzes/exams/question banks, timed attempts, randomization and automatic marking.
- Rubrics, weighted/final gradebooks, exports, attendance, calendar and academic-history workflows.
- Student file submissions, rich syllabus editing, editing/removal/reordering of delivery content and explicit publication management beyond create/save.
- Timetable conflict validation, program-specific eligibility and configurable institutional grading/registration policies.
- Self-service institution onboarding/profile administration, account recovery/invitation flows and multi-role membership within one institution (one role per institution currently).
- Catalog/admin lists are bounded to 100/200 records; full pagination/search scalability is pending.
- Generated Supabase database types and more precise query DTOs are pending; strict TypeScript currently uses validated inputs and selected result-shape assertions in places.
- Antivirus/quarantine, orphan upload cleanup, retention/backup policies, rate-limit hardening, full accessibility and load audits.
- Independent PostgreSQL connection race tests and complete hosted student/faculty/admin browser journey.
- Workspace/Passport integrations beyond ordinary external links.

## Next milestones

1. Resolve repository creation permission and Supabase organization/free project capacity. Push this milestone and provision the dedicated backend.
2. Apply migrations, generate types, run advisors, verify actual Auth/Storage APIs and race tests. Complete the two-institution hosted pilot journey.
3. Complete assessment engine and academic records with authorization tests.
4. Import the repository into exactly one Vercel project, verify Git automatic deployments, and test the minimal website proxy integration at the mandatory public URL.
