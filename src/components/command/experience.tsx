"use client";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { Brand } from "../brand";
import { Icon } from "../icon";
import { CommandDashboard } from "./dashboard";
import { StudyTools } from "./course-tools";
import {
  fictionalCommandData,
  fictionalEvidence,
  fictionalMessage,
} from "@/lib/command/fixtures";
import {
  workspaceHandoff,
  type WorkspaceTool,
} from "@/lib/command/integrations";
import type { Activity } from "@/lib/command/model";
const views = [
  "dashboard",
  "course",
  "correspondence",
  "progression",
  "class",
  "evidence",
] as const;
type View = (typeof views)[number];
const names: Record<View, string> = {
  dashboard: "Dashboard",
  course: "Course",
  correspondence: "Correspondence",
  progression: "Progression",
  class: "Class",
  evidence: "Evidence",
};
const asView = (value?: string): View =>
  views.includes(value as View) ? (value as View) : "dashboard";
export function AcademicExperience({
  initialView,
  initialTask,
}: {
  initialView?: string;
  initialTask?: string;
}) {
  const [view, setView] = useState<View>(asView(initialView));
  const [task, setTask] = useState(initialTask === "data" ? "data" : "essay");
  const [scratch, setScratch] = useState("");
  const [scratchSaved, setScratchSaved] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [courseChoice, setCourseChoice] = useState("");
  const [association, setAssociation] = useState(false);
  const [reviewTask, setReviewTask] = useState(false);
  const [deadline, setDeadline] = useState("2026-11-05T16:00");
  const [revision, setRevision] = useState<Activity | null>(null);
  const [proposal, setProposal] = useState(false);
  const [proposalKept, setProposalKept] = useState(false);
  const [reply, setReply] = useState(
    "Thank you. I will clarify the survey limitations and separate observation from interpretation.",
  );
  const [replyReviewed, setReplyReviewed] = useState(false);
  const [goal, setGoal] = useState("Policy research");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [nodeOpen, setNodeOpen] = useState(false);
  const [projectReview, setProjectReview] = useState(false);
  const [projectProposed, setProjectProposed] = useState(false);
  const [admission, setAdmission] = useState<
    "not-requested" | "waiting" | "approved" | "joined"
  >("not-requested");
  const [consent, setConsent] = useState(false);
  const [notesPublished, setNotesPublished] = useState(false);
  const [ownsEvidence, setOwnsEvidence] = useState(false);
  const [shareEvidence, setShareEvidence] = useState(false);
  const [candidateReviewed, setCandidateReviewed] = useState(false);
  const [notice, setNotice] = useState("");
  const go = (next: View, selectedTask?: string) => {
    setView(next);
    if (selectedTask)
      setTask(
        selectedTask === "data"
          ? "data"
          : selectedTask === "presentation"
            ? "presentation"
            : "essay",
      );
    const suffix = selectedTask
      ? `&task=${encodeURIComponent(selectedTask)}`
      : "";
    window.history.replaceState(
      null,
      "",
      `/cam/experience-demo?view=${next}${suffix}`,
    );
    setNotice("");
    document.getElementById("main")?.focus();
  };
  function intercept(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as Element).closest("a");
    if (
      !link ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const href = link.getAttribute("href") || "";
    if (/^https?:/.test(href) || href.startsWith("#")) return;
    const raw = href.replace(/^\/cam(?=\/|$)/, "");
    let next: View | undefined;
    if (raw.startsWith("/experience-demo")) {
      const url = new URL(raw, "https://campus.example.invalid");
      next = asView(url.searchParams.get("view") || undefined);
      event.preventDefault();
      go(next, url.searchParams.get("task") || undefined);
      return;
    }
    if (
      raw.startsWith("/courses") ||
      raw.startsWith("/my-courses") ||
      raw.startsWith("/grades")
    )
      next = "course";
    if (raw.startsWith("/calendar")) next = "class";
    if (raw.startsWith("/connections"))
      next = raw.includes("roadmaps") ? "progression" : "correspondence";
    if (next) {
      event.preventDefault();
      go(next);
    }
  }
  const tool: WorkspaceTool =
    task === "data" ? "sheet" : task === "presentation" ? "slides" : "doc";
  const toolName =
    tool === "sheet" ? "Tables" : tool === "slides" ? "Present" : "Write";
  const correctAssociation = courseChoice === "demo-pol202";
  const validDeadline =
    Number.isFinite(Date.parse(`${deadline}Z`)) &&
    Date.parse(`${deadline}Z`) > Date.parse(fictionalCommandData.now);
  const proposalStart = revision?.at
    ? new Date(Date.parse(revision.at) - 2 * 3600000).toLocaleString("en-GB", {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No confirmed date";
  const data = {
    ...fictionalCommandData,
    progression: {
      goal,
      capability: fictionalEvidence.capability,
      evidenceTitle: fictionalEvidence.title,
      href: "/experience-demo?view=progression",
      state: "demo" as const,
    },
    activities: [
      ...fictionalCommandData.activities,
      ...(revision ? [revision] : []),
    ],
  };
  return (
    <div className="demo-experience" onClickCapture={intercept}>
      <header className="demo-toolbar">
        <Link className="brand" href="/experience-demo">
          <Brand />
          <span>
            Campus<small>Academic experience</small>
          </span>
        </Link>
        <Link className="text-link" href="/login">
          Institution sign in <Icon name="arrow" size={15} />
        </Link>
      </header>
      <div className="demo-source" role="status">
        <Icon name="info" size={17} />
        <span>
          <strong>Fictional walkthrough</strong> · No account connected. No real
          academic records are changed.
        </span>
      </div>
      <nav className="demo-tabs" aria-label="Fictional journey navigation">
        {views.map((item) => (
          <button
            type="button"
            className={view === item ? "secondary is-active" : "quiet"}
            key={item}
            aria-current={view === item ? "page" : undefined}
            onClick={() => go(item)}
          >
            {names[item]}
          </button>
        ))}
      </nav>
      <main id="main" tabIndex={-1}>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {view === "dashboard" && <CommandDashboard data={data} />}
        {view === "course" && (
          <>
            <div className="page-top">
              <div>
                <p className="eyebrow">
                  {task === "data" ? "DATA210" : "POL202"} · Fictional course
                </p>
                <h1>
                  {task === "data"
                    ? "Working with public data"
                    : "Evidence for public policy"}
                </h1>
                <p>
                  Autumn 2026 · {task === "data" ? 5 : 6} credits · Dr Lena
                  Vermeer, fictional instructor
                </p>
              </div>
            </div>
            <div className="demo-grid">
              <section className="card demo-panel">
                <div className="section-heading">
                  <h2>Assignment workspace</h2>
                  <span className="pill">Demo draft</span>
                </div>
                <label>
                  Choose assignment
                  <select
                    value={task}
                    onChange={(e) => {
                      setTask(e.target.value);
                      setScratchSaved(false);
                    }}
                  >
                    <option value="essay">Policy brief · essay</option>
                    <option value="data">
                      Compare public datasets · analysis
                    </option>
                    <option value="presentation">
                      Present your recommendation · presentation
                    </option>
                  </select>
                </label>
                <h3>
                  {task === "data"
                    ? "Compare two public datasets"
                    : task === "presentation"
                      ? "Present an evidence-led recommendation"
                      : "A policy brief supported by evidence"}
                </h3>
                <p>
                  {task === "data"
                    ? "Compare the coverage and limitations of two published datasets. Keep observations separate from your interpretation."
                    : task === "presentation"
                      ? "Prepare five slides: question, evidence, limitations, recommendation and references."
                      : "Write a 600-word brief. Compare two sources, explain their limitations and justify one recommendation. Include your references."}
                </p>
                <p className="small">
                  Due {task === "data" ? "5" : "2"} November 2026, 16:00 UTC ·
                  Fictional published instructions
                </p>
                <div className="review-box">
                  <h3>Your next step</h3>
                  <a className="button" href={workspaceHandoff(tool)}>
                    Open {toolName}
                    <Icon name="external" size={16} />
                  </a>
                  <p className="small">
                    Opens your {toolName} file list in Workspace. It does not
                    create, attach or submit a document. Workspace keeps its own
                    sign-in.
                  </p>
                </div>
                <label>
                  Local scratch draft
                  <textarea
                    value={scratch}
                    onChange={(e) => {
                      setScratch(e.target.value);
                      setScratchSaved(false);
                    }}
                    maxLength={5000}
                    placeholder="Try a short outline in this fictional walkthrough"
                  />
                </label>
                <button
                  className="secondary"
                  type="button"
                  disabled={!scratch.trim()}
                  onClick={() => setScratchSaved(true)}
                >
                  Keep demo draft
                </button>
                {scratchSaved && (
                  <p role="status" className="small">
                    Draft kept in this walkthrough only. No Campus submission
                    was made.
                  </p>
                )}
                <p className="small">
                  Submission is unavailable in this walkthrough. Your real
                  coursework must be submitted from its authorised course page.
                </p>
              </section>
              <aside>
                <section className="card demo-panel">
                  <h2>Related material</h2>
                  <button
                    className="quiet"
                    type="button"
                    onClick={() => setReadingOpen(!readingOpen)}
                  >
                    <Icon name="file" size={16} /> Review methods notes
                  </button>
                  {readingOpen && (
                    <div className="review-box">
                      <h3>Judging the strength of a source</h3>
                      <p>
                        Ask what was measured, whose experience is missing and
                        what the evidence cannot establish. A source can be
                        useful without answering every question.
                      </p>
                      <p className="small">
                        Published fictional course reading ·
                        demo-reading-methods
                      </p>
                    </div>
                  )}
                  <button
                    className="quiet"
                    type="button"
                    onClick={() => go("correspondence")}
                  >
                    <Icon name="mail" size={16} /> Review related feedback
                  </button>
                  <button
                    className="quiet"
                    type="button"
                    onClick={() => go("class")}
                  >
                    <Icon name="video" size={16} /> Course session & notes
                  </button>
                </section>
                <section className="card demo-panel">
                  <h2>Study assistance</h2>
                  <StudyTools />
                </section>
              </aside>
            </div>
          </>
        )}
        {view === "correspondence" && (
          <>
            <div className="page-top">
              <div>
                <p className="eyebrow">Private correspondence · Demo</p>
                <h1>Feedback into a next step</h1>
                <p>Confirm the source and course before proposing an action.</p>
              </div>
            </div>
            <div className="demo-grid">
              <section className="card demo-panel">
                <span className="pill">Fictional Mail message</span>
                <h2>{fictionalMessage.subject}</h2>
                <p className="small">
                  From {fictionalMessage.sender} · source {fictionalMessage.id}
                </p>
                <blockquote className="demo-source">
                  {fictionalMessage.body}
                </blockquote>
                <label>
                  Associate with a course
                  <select
                    value={courseChoice}
                    onChange={(e) => {
                      setCourseChoice(e.target.value);
                      setAssociation(false);
                      setReviewTask(false);
                    }}
                  >
                    <option value="">Select your confirmed course</option>
                    <option value="demo-pol202">
                      POL202 · Evidence for public policy
                    </option>
                    <option value="demo-data210">
                      DATA210 · Working with public data
                    </option>
                  </select>
                </label>
                {courseChoice && !correctAssociation && (
                  <p role="alert" className="small">
                    The explicit POL202 code does not match this course. No
                    association was made.
                  </p>
                )}
                <button
                  type="button"
                  disabled={!correctAssociation}
                  onClick={() => setAssociation(true)}
                >
                  Confirm course association
                </button>
                {association && (
                  <p className="small" role="status">
                    Confirmed against fictional POL202 membership. The message
                    remains private.
                  </p>
                )}
              </section>
              <section className="card demo-panel">
                <h2>Revision task</h2>
                <p className="small">
                  An email is a source, not an instruction to change official
                  records.
                </p>
                <button
                  type="button"
                  className="secondary"
                  disabled={!association}
                  onClick={() => setReviewTask(true)}
                >
                  Review revision task
                </button>
                {reviewTask && (
                  <div className="review-box">
                    <h3>Clarify the survey limitations</h3>
                    <p>
                      Separate the observations from your interpretation in the
                      methods section.
                    </p>
                    <p className="small">
                      Source: {fictionalMessage.id} · POL202 · private personal
                      task
                    </p>
                    <label>
                      Confirm deadline (UTC)
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!validDeadline}
                      onClick={() => {
                        setRevision({
                          id: "demo-request-revision-041",
                          courseId: "demo-pol202",
                          course: "POL202",
                          title: "Clarify the survey limitations",
                          kind: "request",
                          href: "/experience-demo?view=correspondence",
                          at: new Date(`${deadline}Z`).toISOString(),
                          state: "not-started",
                          description: `Reviewed personal task from ${fictionalMessage.id}`,
                        });
                        setNotice(
                          "Personal revision task added to the fictional dashboard. No academic deadline was changed.",
                        );
                      }}
                    >
                      Add personal revision task
                    </button>
                    {revision && (
                      <p className="small">
                        One source-linked task exists. Repeating this action
                        updates the same task.
                      </p>
                    )}
                  </div>
                )}
                <button
                  className="quiet"
                  type="button"
                  disabled={!revision}
                  onClick={() => setProposal(true)}
                >
                  Review Calendar proposal
                </button>
                {proposal && (
                  <div className="review-box">
                    <h3>Personal revision block</h3>
                    <p>POL202 · {proposalStart} UTC · 1 hour</p>
                    <p className="small">
                      Proposal only. The official course timetable is unchanged.
                    </p>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => setProposalKept(true)}
                    >
                      Keep Calendar proposal
                    </button>
                    {proposalKept && (
                      <p role="status" className="small">
                        Proposal kept in this walkthrough. Calendar write
                        integration is unavailable; nothing was scheduled
                        externally.
                      </p>
                    )}
                  </div>
                )}
                <label>
                  Reply draft
                  <textarea
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      setReplyReviewed(false);
                    }}
                    maxLength={3000}
                  />
                </label>
                <button
                  className="secondary"
                  type="button"
                  disabled={!proposalKept || !reply.trim()}
                  onClick={() => setReplyReviewed(true)}
                >
                  Review reply
                </button>
                {replyReviewed && (
                  <div className="review-box">
                    <h3>Reply review</h3>
                    <p>{reply}</p>
                    <p role="status" className="small">
                      Mail hand-off unavailable. This reply has not been sent or
                      published.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        {view === "progression" && (
          <>
            <div className="page-top">
              <div>
                <p className="eyebrow">Your progression · Demo</p>
                <h1>Build on work already completed</h1>
                <p>Historical study stays historical when your goals change.</p>
              </div>
            </div>
            <div className="demo-grid">
              <section className="card demo-panel">
                <label>
                  Selected future goal
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option>Policy research</option>
                    <option>Archival research</option>
                  </select>
                </label>
                <h2>{fictionalEvidence.title}</h2>
                <p className="small">
                  {fictionalEvidence.course} · completed 20 June 2024 ·
                  fictional academic history
                </p>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setEvidenceOpen(!evidenceOpen)}
                >
                  View supporting evidence
                </button>
                {evidenceOpen && (
                  <div className="review-box">
                    <blockquote>{fictionalEvidence.quote}</blockquote>
                    <p className="small">
                      Source: {fictionalEvidence.source} ·{" "}
                      {fictionalEvidence.id}
                    </p>
                    <p className="small">{fictionalEvidence.reviewStatus}</p>
                  </div>
                )}
                <p className="small">
                  This same evidence supports both selected goals. Changing
                  goals does not duplicate it or turn completed education into a
                  future plan.
                </p>
                <button
                  className="quiet"
                  type="button"
                  onClick={() => go("evidence")}
                >
                  Review for Passport <Icon name="arrow" size={15} />
                </button>
              </section>
              <section className="card demo-panel">
                <span className="pill">Fictional Roadmaps node</span>
                <h2>{fictionalEvidence.capability}</h2>
                <p>Relevant preparation for {goal.toLowerCase()}.</p>
                <button
                  type="button"
                  disabled={!evidenceOpen}
                  onClick={() => setNodeOpen(true)}
                >
                  Inspect capability node
                </button>
                {nodeOpen && (
                  <div className="review-box">
                    <h3>Evidence & preparation</h3>
                    <p>
                      Existing evidence: {fictionalEvidence.title} (
                      {fictionalEvidence.id}).
                    </p>
                    <p>
                      <strong>Helpful preparation:</strong> compare a
                      contemporary dataset with an archival account.
                    </p>
                    <p>
                      <strong>Formal prerequisites:</strong> unknown. No
                      admissions or job eligibility is claimed.
                    </p>
                    <p className="small">
                      The real corresponding Roadmaps node is unavailable
                      without an authorised mapping. This node is a fictional
                      example.
                    </p>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => setProjectReview(true)}
                    >
                      Review next project
                    </button>
                  </div>
                )}
                {projectReview && (
                  <div className="review-box">
                    <h3>Proposed project: two sources, one policy question</h3>
                    <p>
                      Use one historical and one current source to explain how a
                      policy claim changed over time. Reuse the existing
                      evidence; add a new project only after review.
                    </p>
                    <button
                      type="button"
                      onClick={() => setProjectProposed(true)}
                    >
                      Keep project proposal
                    </button>
                    {projectProposed && (
                      <p role="status" className="small">
                        One personal project proposal is kept in this
                        walkthrough. No Roadmaps record was created.
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        {view === "class" && (
          <>
            <div className="page-top">
              <div>
                <p className="eyebrow">Today’s schedule · Demo</p>
                <h1>Evidence clinic</h1>
                <p>
                  POL202 · 1 November 2026, 10:30–11:30 UTC · scheduled class
                </p>
              </div>
            </div>
            <div className="demo-grid">
              <section className="card demo-panel">
                <span className="pill">Simulated Sessions</span>
                <h2>Class admission</h2>
                <p>
                  No real meeting is created. Admission and recording consent
                  are separate choices.
                </p>
                {admission === "not-requested" && (
                  <button type="button" onClick={() => setAdmission("waiting")}>
                    Request admission
                  </button>
                )}
                {admission === "waiting" && (
                  <div className="review-box">
                    <p role="status">Waiting for the fictional host.</p>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setAdmission("approved")}
                    >
                      Simulate host approval
                    </button>
                  </div>
                )}
                {admission === "approved" && (
                  <button type="button" onClick={() => setAdmission("joined")}>
                    Join simulated class
                  </button>
                )}
                {admission === "joined" && (
                  <p role="status" className="notice">
                    Admitted to the fictional class. No audio, video or
                    transcript is captured.
                  </p>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />{" "}
                  I consent to recording in this simulation
                </label>
                <p className="small">
                  Consent is{" "}
                  {consent ? "given and can be revoked" : "not given"}. You may
                  attend without recording consent. This example never records
                  or uploads anything.
                </p>
                <p className="small">
                  Live Sessions integration requires verified course admission
                  and published-notes delivery. No legitimate live course link
                  is available in this isolated fixture.
                </p>
              </section>
              <section className="card demo-panel">
                <h2>Published lecture notes</h2>
                {!notesPublished ? (
                  <>
                    <p className="compact-empty">
                      The fictional instructor has not published notes.
                    </p>
                    <button
                      type="button"
                      className="secondary"
                      disabled={admission !== "joined"}
                      onClick={() => setNotesPublished(true)}
                    >
                      Simulate notes publication
                    </button>
                  </>
                ) : (
                  <article className="review-box">
                    <span className="pill">Published · fictional</span>
                    <h3>Separate evidence from interpretation</h3>
                    <p>
                      Compare coverage, measurement and missing perspectives
                      before making a recommendation.
                    </p>
                    <p className="small">
                      Source: fictional course notes demo-note-pol202-01. No
                      transcript or private recording is exposed.
                    </p>
                    <button
                      className="quiet"
                      type="button"
                      onClick={() => go("course")}
                    >
                      Return to course readings <Icon name="arrow" size={15} />
                    </button>
                  </article>
                )}
              </section>
            </div>
          </>
        )}
        {view === "evidence" && (
          <>
            <div className="page-top">
              <div>
                <p className="eyebrow">Evidence review · Demo</p>
                <h1>A candidate, not a credential</h1>
                <p>
                  Choose what to disclose after reviewing its source and limits.
                </p>
              </div>
            </div>
            <div className="demo-grid">
              <section className="card demo-panel">
                <span className="pill">Completed project</span>
                <h2>{fictionalEvidence.title}</h2>
                <p className="small">
                  Completed {fictionalEvidence.completedAt} ·{" "}
                  {fictionalEvidence.course}
                </p>
                <blockquote>{fictionalEvidence.quote}</blockquote>
                <dl>
                  <dt>Source</dt>
                  <dd>{fictionalEvidence.source}</dd>
                  <dt>Record</dt>
                  <dd>{fictionalEvidence.id}</dd>
                  <dt>Review status</dt>
                  <dd>{fictionalEvidence.reviewStatus}</dd>
                  <dt>Ownership</dt>
                  <dd>{fictionalEvidence.ownership}</dd>
                </dl>
                <p className="small">
                  A submission, attendance record or generated summary does not
                  independently establish competence.
                </p>
              </section>
              <section className="card demo-panel">
                <h2>Disclosure choices</h2>
                <label>
                  <input
                    type="checkbox"
                    checked={ownsEvidence}
                    onChange={(e) => {
                      setOwnsEvidence(e.target.checked);
                      setCandidateReviewed(false);
                    }}
                  />{" "}
                  I confirm ownership for this fictional review
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={shareEvidence}
                    onChange={(e) => {
                      setShareEvidence(e.target.checked);
                      setCandidateReviewed(false);
                    }}
                  />{" "}
                  Include the source quote in a proposed disclosure
                </label>
                <button
                  type="button"
                  disabled={!ownsEvidence}
                  onClick={() => setCandidateReviewed(true)}
                >
                  Review evidence candidate
                </button>
                {candidateReviewed && (
                  <div className="review-box">
                    <h3>Candidate review</h3>
                    <p>{fictionalEvidence.title}</p>
                    <p className="small">
                      Source quote:{" "}
                      {shareEvidence ? "included by your choice" : "withheld"} ·
                      unverified candidate · source and ownership retained.
                    </p>
                    <p role="status">
                      Career Passport hand-off unavailable. No credential was
                      issued, no evidence was published and nothing was sent
                      externally.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        <span>Fictional fixtures · session-only proposals</span>
        <span>Authoritative academic records are untouched.</span>
      </footer>
    </div>
  );
}
