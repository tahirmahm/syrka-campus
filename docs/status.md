# Syrka Campus — verified status

The first pilot workflows are implemented. This is not yet the complete Moodle/Canvas-scale scope in the master directive.

## Infrastructure

- Canonical public path: https://www.syrka.co/cam, changed from /campus by the owner.
- Source: https://github.com/tahirmahm/syrka-campus, main; public for now by owner instruction.
- Exactly one Campus Vercel project, `syrka-campus`, on Hobby, directly linked to GitHub main. Git-triggered deployments verified.
- Dedicated Supabase project: `pftbpimhyophitfuzcxn`, EU West 1, supplied by the owner through a new account. All eight migrations applied and recorded. Existing Syrka databases were not modified.
- Existing website proxy rules committed in tahirmahm/syrka.v12 PR #22. Existing Workspace rules and cron configuration preserved. No DNS changes.
- Praxis Institute and its owner-approved administrator membership created. A private one-time account setup link is prepared; it is not stored in Git.
- Separate Syrka Demonstration Campus provisioned with three demo roles and sample academic records. One-click access is part of the pending Git release. Demo credentials remain server-only.
- Production backend/demo environment variables configured. The next Git release activates the updated app and demo interface; final production browser checks remain pending at this commit.

## Implemented

- Responsive interface, original brand assets, light/dark appearance, labelled forms and keyboard focus.
- Supabase email/password sessions, refresh proxy, isolated `/cam` cookies, server-side authorization and institution switching.
- Departments, terms, courses, sections, faculty assignments, memberships and registration windows.
- Searchable catalog, credits, prerequisites, transactional registration/withdrawal, waitlists, promotion and duplicate/capacity validation.
- Course syllabi, weekly modules, HTTPS resources, private PDF/document uploads, signed downloads, announcements and publication controls.
- Text assignment drafts/final submissions, deadline and submission-limit enforcement, marking and published feedback.
- Five assessment question types, timed attempts, limits, randomized ordering, immutable question/key snapshots, save/final submission, automatic marking and faculty review.
- Answer keys protected from student table access; result publication gates enforced by database RPCs. Expired attempts finalize only previously saved responses.
- Course attendance, calendars, weighted category/item gradebooks, calculated final results and authorized final-grade CSV export.
- Enrollment oversight and sensitive-operation audit records.
- One-time invitation/recovery confirmation and password setup. Public account signup is disabled; institutional membership never comes from editable user metadata.
- Student/faculty dashboards scope current courses to enrollments/assignments; upcoming assessments and calendar events are displayed.

## Verification

- 15 SQL tests pass against actual migrations, including two institutions, confidentiality, role escalation denial, registration, assignments, assessments and academic records.
- Five independent PostgreSQL tests pass for registration races (parent plus four scenarios); eighth migration revalidation in CI pending.
- Six hosted API verification groups pass: structure/isolation, concurrent registration, actual Storage upload/signing, assignments/grades, assessments, records/metadata escalation denial.
- Two browser tests pass using the local production app with the real hosted backend: student/faculty/admin journey and all three one-click demo roles. The journey includes actual uploads, drafts/final submission, draft-grade confidentiality, publication, foreign-tenant rejection, `/cam` cookie scope and sign-out.
- Two local setup/mobile Chromium tests and four public production proxy/mobile/preservation smoke tests passed in earlier releases.
- Database types generated from the hosted schema; broader replacement of legacy dynamic queries with those types remains pending.
- Lint and strict production build pass. PRs #1–#3 completed GitHub CI and Git deployment checks.
- Advisor performance warnings about overlapping SELECT/write policies were resolved in migration eight. One remaining security warning: Supabase leaked-password protection requires Pro; it was not enabled under the zero-cost rule. Twelve-character mixed-character passwords are configured. See deployment verification for evidence and limits.

## Remaining scope

- Student assignment file attachments, rubrics, rich content editing/reordering and reusable question-bank imports.
- Timetable conflict checking, program-specific eligibility, institutional grading scales and official transcripts/academic completion workflows.
- Full institutional profile/branding administration, account-invitation UI and multiple simultaneous roles within one institution.
- Full pagination, fully integrated database types, retention/quarantine, load testing and a complete WCAG audit.
- Workspace/Passport integrations beyond documented external-link boundaries.
- Independent-session races beyond registration and broader assessment/browser coverage.

No paid infrastructure, subscriptions, APIs or add-ons were enabled.
