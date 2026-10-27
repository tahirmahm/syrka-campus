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
