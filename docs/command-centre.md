# Academic command centre — Preview delivery

## Baseline and release boundary

Started from verified main `82b020b53a97713740b9f3565a1e04666a4c760b` after fetching branches and inspecting the only open PR, #8 (`feature/sessions-notes`). That branch reports unapplied hosted Sessions migrations, Campus connector permission failures and incomplete media/admission acceptance; it remains unmerged. This feature branch does not silently import its schema, provider keys or runtime dependencies.

Reuse `syrka-campus`, `/cam` and Git-triggered Preview deployments only. No production merge, promotion, routing, DNS, database migrations or changes to another application are part of this delivery. New user instruction supersedes the earlier light-only design: dark defaults to black/neutral surfaces, with a complete explicit light theme. A scoped appearance cookie is rendered server-side to prevent refresh flashes.

## Implemented product behaviour

- Student Next up uses actual authorised assignments, published assessment availability/deadlines, published own feedback, readings and scheduled events. Today and This week separate events from tasks and share activity identities. Search/status filters, resume, personal pins and suggestion dismissal do not alter academic records.
- Compact courses retain credits, term, outstanding work, published feedback and completed history. No percentage completion or invented capability is displayed.
- Existing faculty and institutional dashboards retain their actions, with role-specific submission review/administration entry points. Existing registration, marking, deadline, publication and audit operations remain authoritative.
- Course workspaces expose next activity, source-linked readings/manual recall cards, contextual Write/Tables/Present file-list handoffs, existing assignments/assessments and honest Sessions setup state.
- Connections expose typed `connected`, `configuration-required`, `unavailable` and demo states, with capability levels distinguishing navigation/read/proposal/write absence.
- Public `/cam/experience-demo` contains isolated fictional journeys. It never inserts fictional users, messages, projects or grades into Supabase. Real accounts are never populated from the fixture. Scratch drafts, reviewed proposals, simulated admission and disclosure state are page-local; personal priority IDs are separately browser-scoped.

## Priority rules

The engine is deterministic and unit-tested. It removes completed/submitted/cancelled work, respects explicit availability, validated timezone-bearing dates and later authorised extensions, and does not invent unknown dates. Imminent scheduled items and hard academic obligations precede optional preparation; optional Roadmaps relevance and personal pins cannot bury compulsory work. Published weight and dependency metadata are considered only when a trusted source actually supplies them. The current schema does not supply per-student extensions or individual assessment weights; the live adapter leaves those unknown.

Own feedback is explicitly filtered to its owner and published state, with source revision in its identity so changed feedback resurfaces. Student attempt status uses the existing `my_attempts` RPC, not the staff-only attempts table. Upcoming assessments remain visible in the schedule before opening. Untyped calendar records are events, not inferred online classes. Limited/stale states disclose retrieval limits and refresh needs. Personal preferences store IDs only, scoped by user and institution; URLs are resolved only against currently authorised data.

## Verified integration boundaries

| App               | Actual capability                                                                                                      | Limit                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Workspace         | Verified canonical navigation and `?app=doc`, `sheet`, `slides` filters, confirmed in `src/components/office.tsx`      | Opens existing app/file list; no document creation, attachment, shared login or submission claim          |
| Academic Calendar | Existing Campus read-only schedule and official records                                                                | Personal demo proposals do not edit institutional dates; no second Calendar built                         |
| Mail              | Versioned contract inspected in `syrka-mail` default `feat/syrka-mail` branch; Campus adapter marked contract-required | No consented identity/message bridge; no private inbox access or send operation                           |
| Sessions          | PR #8 inspected; its course identifiers and canonical meeting-link convention documented                               | Hosted migrations/admission/media gates remain incomplete; no fabricated join link or notes               |
| Roadmaps          | Reviewed existing capability/academic import contract                                                                  | No user-scoped selected-goal or exact-node integration; fictional local node only                         |
| Career Passport   | Reviewable evidence candidate in fictional journey                                                                     | No authorised live receiving contract, automatic competence or credential issuance                        |
| Alibaba/Qwen      | Existing Sessions architecture inspected; not configured on verified main                                              | No secrets copied, provider calls or paid fallback. Manual source-linked recall remains useful without AI |

Live `/mail`, `/roadmap`, `/roadmaps`, `/calendar` and `/workspace/sessions` destinations were unavailable during the audit; no nonfunctional launcher links are invented. Roadmaps document-supported imports are not issuer verification. Course titles alone never become capability assertions. Private correspondence and transcripts are never published as course content.

## Fictional journey acceptance

1. Dashboard assignment → instructions → real Workspace filtered list → return, with no false submission confirmation.
2. Explicit message course code + confirmed membership → reviewed revision/date → idempotent personal task → reviewed Calendar proposal → reply draft review; external Calendar/Mail writes clearly unavailable.
3. Completed 2024 coursework → source-supported evidence → fictional capability node → reviewed next project; evidence reused across goals without changing historical education.
4. Today → simulated waiting room → explicit simulated host approval → attendance without recording consent → separately published fictional notes. No media or transcript captured.
5. Completed project → ownership/disclosure review → candidate, with Passport handoff explicitly unavailable.
6. Existing SQL regressions verify two-institution isolation, private submissions, unreleased grades/keys, registration and protected shared identities. The public fictional demo is not evidence of live Mail/Session isolation.

## Verification evidence

Recorded after integrated checks and Preview inspection. Screenshots cover desktop/mobile in both themes; browser/axe checks are not a full assistive-technology or WCAG conformance certification.
