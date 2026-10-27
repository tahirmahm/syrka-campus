# Light wayfinding redesign

## Milestone 1: audit and design system

Preserve `/cam`, the existing repository/project/backend, all mutations and authorization. No schema migrations, data resets, Workspace changes or new infrastructure are required.

Live Workspace inspection: white application surfaces, a narrow left rail, understated borders, compact controls, restrained editorial headings and softly differentiated cards. Campus adapts this family language with labelled academic destinations rather than productivity tools.

Campus inventory: login and password setup; dashboard; catalog; registration; grades; course delivery; course records/attendance/calendar; assessment authoring; attempts/marking; administration; private downloads and grade export. Existing gaps stay explicit. The original stylesheet has system dark media queries and data-theme overrides; the Theme component toggles appearance. Text arrows appear throughout actions and links and can render as emoji. Mobile navigation currently scrolls horizontally.

Tokens: ivory #FAFAF8, white #FFFFFF, cloud #F1F3F5, charcoal #26282B, slate blue #536D91, powder blue #E8EFF8, lavender #EEEAF7, apricot #F7E9DE, border #E2E5E9, muted #606974. Inter for controls/body; restrained Georgia for selected editorial headings. Compact spacing, 44px controls, visible focus, rounded 10–14px surfaces, no decorative gradients.

Branding uses the exact official raster assets as luminance masks. This produces transparent rendering in charcoal without redrawing or changing the mark. Source JPGs remain untouched.

## Controlled milestones

1. Audit, token and route inventory.
2. Shared light-only shell, role-aware navigation, native-dialog mobile drawer, brand and SVG icons.
3. Login, dashboard, catalog/course delivery, registration, grades and read-only aggregate academic destinations.
4. Faculty/admin forms, record tables, assessment/attempt pages and navigation consistency.
5. Responsive checks at 320/375/390/430/768/1024/1440, keyboard/focus/drawer checks, role journeys, security regression suites, screenshots and Git-triggered production deployment.

Read-only aggregate destinations use existing session-scoped queries and RLS. They add no academic capabilities or fabricated data. Instructor names are displayed only if authorized data supplies them; no identities are invented from UUIDs.

Verification evidence and screenshots are recorded below.

## Milestone 2: shared shell

Implemented a labelled desktop sidebar, role-specific destinations, a native-dialog mobile drawer with explicit Tab wrapping and Escape focus restoration, the institution switcher, user/sign-out controls, active navigation and breadcrumbs. Official images are rendered as luminance masks on light surfaces. Dark preferences and the toggle have no active styling path. Inter and Lucide are pinned, open-source dependencies.

Checks: strict build and lint passed. All seven requested widths passed student route overflow/light checks. The mobile focus test found a Chromium boundary case; the explicit trap fixed it and the targeted test passed.

## Milestone 3: student experience

Replaced the login hero with a restrained light authentication layout and compact, consistent demo actions. Dashboard now groups current authorized courses, unfinished upcoming assignments, assessments, announcements, calendar and actual published feedback. New read-only My Courses, Assignments, Assessments and Calendar destinations use existing RLS-protected tables.

Courses have contextual anchor navigation, chronological modules, file-type/resource rows, compact empty states and a registration explanation when content is unavailable to a non-enrolled viewer. Catalog adds a supported department filter. Registration retains the existing transactional action and adds status labels plus native confirmation for withdrawal. Grades separate final course results, assessment scores/feedback and configured weighting.

## Milestone 4: faculty and administration

Shared typography, controls, tables, status badges and pending-submit buttons apply to assigned-course delivery, submissions, assessments, marking, attendance, calendar and administrative configuration. Existing actions and field names are retained. No unsupported institution-profile, rubric, transcript or completion controls were added.

Checks: 16 SQL tests and all six hosted API verification groups passed. The actual hosted-backend browser journey passed, including drafts/final submission, draft-grade secrecy, publication, cross-tenant denial, scoped cookies, withdrawal and sign-out. Three demo roles remained usable. Automated WCAG A/AA checks passed for representative pages and the mobile drawer. Full conformance is not claimed.

## Milestone 5: verification and release

The light redesign merged through [PR #5](https://github.com/tahirmahm/syrka-campus/pull/5). Main `f344b0405762ecd074924e8ff1bbe8d44927b430` automatically produced Git deployment `dpl_A5hEo4q9WTZSnvTEFCU4mLTGAedC`, observed READY at the existing canonical URL, https://www.syrka.co/cam. Both PR and main GitHub checks passed. The final error-state follow-up preserves this route and uses the same Git workflow.

Verified on 27 October 2026:

- Lint and strict TypeScript production build passed; 16 SQL authorization tests and five independent PostgreSQL registration-concurrency tests passed in CI.
- Six hosted API verification groups passed using separate temporary test institutions. No migrations or production academic records were changed.
- Both hosted browser tests passed through the canonical website: administrator configuration, faculty upload, real signed PDF download, assignment draft/final submission, draft-grade secrecy, published feedback, confirmed withdrawal, cross-institution denial, scoped authentication cookies/sign-out and all three demo roles.
- Live responsive checks cover 320, 375, 390, 430, 768, 1024 and 1440 pixels. They exercise actual student course content, contextual course navigation, records and aggregate destinations. Faculty/admin tours cover desktop/mobile forms, tables and teaching tools.
- Keyboard drawer trapping, Escape/focus restoration, cancellation of withdrawal, stored dark preferences, system-dark overrides and absence of emoji/text-arrow icons were checked.
- Automated axe checks passed on representative login, student and mobile navigation pages. This is not a full WCAG conformance audit.
- Four live routing checks passed, including direct access/refresh and preservation of `/`, `/workspace` and `/workspace/tools`.

A live edge-case check found that Next.js's default 404 follows system dark preferences. A custom light-only branded not-found page and matching retry state replace it; a dedicated 320px/dark-preference and axe regression check passes. Browser suites use separate artifact directories so concurrent runs cannot remove each other's downloads or traces.

The original brand images, all nine migration files, authentication/mutation logic, Supabase configuration, website proxy, Workspace and `/campus` remain unchanged. No projects, DNS changes, paid services or new academic capabilities were introduced. Temporary verification records and identities are removed separately from Praxis Institute and the demonstration campus.

## Screenshots

Captured from the canonical production deployment using sample demo accounts, at 1440px desktop and 390px mobile widths. All data shown belongs to the separate demonstration campus.

| Experience             | Desktop                                              | Mobile                                              |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| Sign in                | [Screenshot](screenshots/desktop-login.png)          | [Screenshot](screenshots/mobile-login.png)          |
| Dashboard              | [Screenshot](screenshots/desktop-dashboard.png)      | [Screenshot](screenshots/mobile-dashboard.png)      |
| Course delivery        | [Screenshot](screenshots/desktop-course.png)         | [Screenshot](screenshots/mobile-course.png)         |
| Course catalog         | [Screenshot](screenshots/desktop-courses.png)        | [Screenshot](screenshots/mobile-courses.png)        |
| Registration           | [Screenshot](screenshots/desktop-registration.png)   | [Screenshot](screenshots/mobile-registration.png)   |
| Grades                 | [Screenshot](screenshots/desktop-grades.png)         | [Screenshot](screenshots/mobile-grades.png)         |
| Calendar               | [Screenshot](screenshots/desktop-calendar.png)       | [Screenshot](screenshots/mobile-calendar.png)       |
| Faculty teaching tools | [Screenshot](screenshots/desktop-faculty-course.png) | [Screenshot](screenshots/mobile-faculty-course.png) |
| Administration         | [Screenshot](screenshots/desktop-administration.png) | [Screenshot](screenshots/mobile-administration.png) |

[Mobile navigation drawer](screenshots/mobile-navigation.png).

## Limits and next steps

Existing backend/product gaps are unchanged and remain listed in [status](status.md). Instructor identities are shown only when authorized data supplies them; no profile information or completion tracking is invented. A manual assistive-technology audit, Safari/Firefox device testing and institutional user testing remain recommended. Automated Chromium/axe evidence does not establish full WCAG 2.2 AA conformance.
