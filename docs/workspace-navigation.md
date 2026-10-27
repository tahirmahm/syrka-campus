# Workspace navigation and emoji audit

Campus links to https://www.syrka.co/workspace using a normal same-tab anchor in the shared desktop sidebar and mobile drawer. The separated Syrka Apps group uses the existing nav-item styles and a Lucide PanelsTopLeft icon at 18px with a 1.7 stroke. No Passport/Roadmap links, credential transfers, API integration, authentication changes or backend changes are introduced.

The source audit covers every route/component, CSS, server-side interface strings, demo provisioning script and version-controlled migrations. No developer-supplied emoji icons remained after the previous light redesign, so no existing icons or seeded records required replacement. Existing SVG arrows/status icons remain unchanged.

`tests/ui-icons.test.ts`, run by `npm test` and GitHub CI, checks TypeScript/TSX string literals, JSX text/attributes, static template portions and owned seed/style/migration sources. It detects emoji, regional indicators, keycaps, escaped JavaScript strings and numeric JSX entities. It preserves ordinary punctuation, copyright text, language scripts and academic mathematical notation.

Runtime database values, submissions, announcements and user documents are excluded: the guard inspects source literals rather than rejecting all text in a rendered page. No content sanitization, database rewrite or user-content deletion occurs. Test fixtures are excluded from the application-source audit so the detector can test positive cases.

Verification commands:

- `npm run lint` and `npm run build` (includes strict TypeScript checking).
- `npm test`: SQL authorization scenarios plus emoji regression cases.
- `npm run test:redesign`: existing responsive/accessibility tours plus student, faculty and administrator Workspace navigation at 1440px, 320px and 390px. Tests follow the actual link and return to Campus with its session intact.
- `npm run test:production`: canonical route, assets, refresh and preservation of existing Syrka/Workspace routes.

Release uses a feature branch, pull request, GitHub checks and the existing Git-triggered syrka-campus Vercel project. `/cam`, `/campus`, Workspace source, DNS, backend records and free-tier infrastructure are unchanged.
