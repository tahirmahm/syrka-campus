export type ConnectionState =
  "connected" | "unavailable" | "configuration-required" | "demo";
export type SuiteAdapter = {
  id: string;
  name: string;
  state: ConnectionState;
  capability: "navigation" | "read" | "proposal" | "none";
  detail: string;
  href?: string;
};
// Only verified destinations. A navigation capability is never a write or an SSO grant.
export const suiteAdapters: SuiteAdapter[] = [
  {
    id: "workspace",
    name: "Workspace",
    state: "connected",
    capability: "navigation",
    href: "https://www.syrka.co/workspace",
    detail:
      "Open your own files. Document creation and submission remain separate actions.",
  },
  {
    id: "mail",
    name: "Mail",
    state: "configuration-required",
    capability: "none",
    detail:
      "A consented, user-scoped correspondence contract is required. No private inbox is read.",
  },
  {
    id: "sessions",
    name: "Sessions",
    state: "configuration-required",
    capability: "none",
    detail:
      "Course Sessions migrations and hosted admission/notes acceptance are pending in PR #8.",
  },
  {
    id: "calendar",
    name: "Academic Calendar",
    state: "connected",
    capability: "read",
    href: "/calendar",
    detail:
      "Official Campus dates. Personal proposals never edit the institutional timetable.",
  },
  {
    id: "roadmaps",
    name: "Roadmaps",
    state: "configuration-required",
    capability: "none",
    detail:
      "No authorised goal or course-to-capability mapping is connected. Completed study remains historical.",
  },
  {
    id: "passport",
    name: "Career Passport",
    state: "unavailable",
    capability: "none",
    detail:
      "Evidence review and disclosure require an authorised destination contract. No credentials are issued.",
  },
  {
    id: "ai",
    name: "Study assistance",
    state: "configuration-required",
    capability: "none",
    detail:
      "No authorised zero-cost provider is configured on this baseline. Manual source-linked study tools remain available.",
  },
];
export type WorkspaceTool = "doc" | "sheet" | "slides";
export function workspaceHandoff(tool: WorkspaceTool) {
  // office.tsx accepts only app=doc|sheet|slides as a file filter; it does not create a document.
  return `https://www.syrka.co/workspace?app=${tool}`;
}
export function connectionLabel(state: ConnectionState) {
  return state === "configuration-required"
    ? "Configuration required"
    : state === "connected"
      ? "Connected"
      : state === "demo"
        ? "Demo"
        : "Unavailable";
}
