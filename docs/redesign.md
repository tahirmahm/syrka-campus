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

Verification evidence and screenshot links will be recorded after implementation.

## Milestone 2: shared shell

Implemented a labelled desktop sidebar, role-specific destinations, a native-dialog mobile drawer with explicit Tab wrapping and Escape focus restoration, the institution switcher, user/sign-out controls, active navigation and breadcrumbs. Official images are rendered as luminance masks on light surfaces. Dark preferences and the toggle have no active styling path. Inter and Lucide are pinned, open-source dependencies.

Checks: strict build and lint passed. All seven requested widths passed student route overflow/light checks. The mobile focus test found a Chromium boundary case; the explicit trap fixed it and the targeted test passed.

## Milestone 3: student experience

Replaced the login hero with a restrained light authentication layout and compact, consistent demo actions. Dashboard now groups current authorized courses, unfinished upcoming assignments, assessments, announcements, calendar and actual published feedback. New read-only My Courses, Assignments, Assessments and Calendar destinations use existing RLS-protected tables.

Courses have contextual anchor navigation, chronological modules, file-type/resource rows, compact empty states and a registration explanation when content is unavailable to a non-enrolled viewer. Catalog adds a supported department filter. Registration retains the existing transactional action and adds status labels plus native confirmation for withdrawal. Grades separate final course results, assessment scores/feedback and configured weighting.

## Milestone 4: faculty and administration

Shared typography, controls, tables, status badges and pending-submit buttons apply to assigned-course delivery, submissions, assessments, marking, attendance, calendar and administrative configuration. Existing actions and field names are retained. No unsupported institution-profile, rubric, transcript or completion controls were added.

Checks: 16 SQL tests and all six hosted API verification groups passed. The actual hosted-backend browser journey passed, including drafts/final submission, draft-grade secrecy, publication, cross-tenant denial, scoped cookies, withdrawal and sign-out. Three demo roles remained usable. Automated WCAG A/AA checks passed for representative pages and the mobile drawer. Full conformance is not claimed.
