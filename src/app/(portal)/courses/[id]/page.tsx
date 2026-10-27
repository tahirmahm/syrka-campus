import { SubmitButton } from "@/components/submit-button";
import { Icon } from "@/components/icon";
import { CourseTabs } from "@/components/course-tabs";
import { Publication } from "@/components/publication";
import Link from "next/link";
import { createAssessment } from "@/lib/assessments";
import { notFound } from "next/navigation";
import { session } from "@/lib/session";
import { PageTop, Hidden, Empty, Status } from "@/components/academic";
import { createDelivery, submit, grade, uploadMaterial } from "@/lib/actions";
export default async function Course({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ institution?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { institution, notice } = await searchParams;
  const { db, user, membership } = await session(institution);
  if (!membership) notFound();
  const tenant = membership.institution_id;
  const { data: offering } = await db
    .from("offerings")
    .select(
      "id,section,syllabus,courses(code,title,description,credits),academic_terms(name)",
    )
    .eq("institution_id", tenant)
    .eq("id", id)
    .maybeSingle();
  if (!offering) notFound();
  const { data: assignment } = await db
    .from("faculty_assignments")
    .select("id")
    .eq("institution_id", tenant)
    .eq("offering_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const teaches =
    membership.role === "admin" ||
    (membership.role === "faculty" && !!assignment);
  const [modules, materials, assignments, announcements] = await Promise.all(
    ["modules", "materials", "assignments", "announcements"].map((t) =>
      db
        .from(t)
        .select("*")
        .eq("institution_id", tenant)
        .eq("offering_id", id)
        .order(t === "modules" ? "position" : "created_at"),
    ),
  );
  if ([modules, materials, assignments, announcements].some((r) => r.error))
    throw new Error("Course information unavailable");
  const { data: submissions, error } = await db
    .from("submissions")
    .select(
      "id,assignment_id,user_id,body,status,revision,grades(points,feedback,published)",
    )
    .eq("institution_id", tenant)
    .in("assignment_id", assignments.data?.map((a) => a.id) ?? []);
  if (error) throw new Error("Submissions unavailable");
  const { data: assessments, error: assessmentError } = await db
    .from("assessments")
    .select("id,title,kind,opens_at,closes_at")
    .eq("institution_id", tenant)
    .eq("offering_id", id)
    .order("opens_at");
  if (assessmentError) throw new Error("Assessments unavailable");
  const c = offering.courses as unknown as {
    code: string;
    title: string;
    description: string;
    credits: number;
  };
  return (
    <>
      <PageTop
        label={`${c.code} · Section ${offering.section}`}
        title={c.title}
        description={`${c.credits} credits · ${(offering.academic_terms as unknown as { name: string }).name}`}
      />
      <CourseTabs tenant={tenant} offering={id} teaches={teaches} />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section id="overview" className="card course-section">
        <h2>Course overview</h2>
        <p>{c.description}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {offering.syllabus || "The syllabus has not been added yet."}
        </p>
      </section>
      <section id="modules" className="course-section">
        <div className="section-heading">
          <h2>Weekly learning path</h2>
          <span className="small">{modules.data?.length ?? 0} modules</span>
        </div>
        <div className="module-list">
          {modules.data?.map((m, index) => (
            <article className="module-card" key={m.id}>
              <span className="module-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                {teaches && (
                  <div className="row">
                    <Status published={m.published} />
                    <Publication
                      tenant={tenant}
                      offering={id}
                      kind="modules"
                      id={m.id}
                      published={m.published}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {!modules.data?.length && (
          <Empty>No modules have been published for this course yet.</Empty>
        )}
      </section>
      <section className="grid">
        <article id="readings" className="card course-section">
          <h2>Readings & resources</h2>
          {materials.data?.map((m) => (
            <div className="resource-row" key={m.id}>
              <span className="resource-icon">
                <Icon name={m.external_url ? "external" : "file"} size={18} />
              </span>
              {m.external_url ? (
                <a
                  href={m.external_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>
                    {m.title}
                    <span className="resource-type">External resource</span>
                  </span>
                  <Icon name="external" size={15} />
                </a>
              ) : (
                <a href={`/cam/files/${m.id}?institution=${tenant}`}>
                  <span>
                    {m.title}
                    <span className="resource-type">
                      {m.object_path?.split(".").pop()?.toUpperCase() ??
                        "Document"}{" "}
                      · Secure download
                    </span>
                  </span>
                  <Icon name="download" size={16} />
                </a>
              )}
              {teaches && (
                <Publication
                  tenant={tenant}
                  offering={id}
                  kind="materials"
                  id={m.id}
                  published={m.published}
                />
              )}
            </div>
          ))}
          {!materials.data?.length && (
            <Empty>No readings have been published for this course yet.</Empty>
          )}
        </article>
        <article id="announcements" className="card course-section">
          <h2>Announcements</h2>
          {announcements.data?.map((a) => (
            <div className="announcement" key={a.id}>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
              {teaches && (
                <Publication
                  tenant={tenant}
                  offering={id}
                  kind="announcements"
                  id={a.id}
                  published={a.published}
                />
              )}
            </div>
          ))}
          {!announcements.data?.length && (
            <Empty>No course announcements yet.</Empty>
          )}
        </article>
      </section>
      <section id="assignments" className="course-section">
        <div className="section-heading">
          <h2>Assignments</h2>
          <span className="small">Instructions, submission & feedback</span>
        </div>
        {assignments.data?.map((a) => {
          const mine = submissions?.find(
            (s) => s.assignment_id === a.id && s.user_id === user.id,
          );
          return (
            <article
              className="card assignment-card"
              id={`assignment-${a.id}`}
              key={a.id}
            >
              <div className="card-top">
                <Status published={a.published} />
                <span className="small">{a.max_points} points</span>
              </div>
              <h3>{a.title}</h3>
              {teaches && (
                <Publication
                  tenant={tenant}
                  offering={id}
                  kind="assignments"
                  id={a.id}
                  published={a.published}
                />
              )}
              <p style={{ whiteSpace: "pre-wrap" }}>{a.instructions}</p>
              <p className="small">
                Due{" "}
                {new Date(a.due_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC · Maximum {a.max_submissions} final submissions
              </p>
              {membership.role === "student" && (
                <form action={submit}>
                  <Hidden tenant={tenant} offering={id} />
                  <input type="hidden" name="assignment" value={a.id} />
                  <label>
                    Your response
                    <textarea
                      name="body"
                      defaultValue={mine?.body ?? ""}
                      maxLength={100000}
                    />
                  </label>
                  <p className="small">
                    Status: {mine?.status ?? "Not started"} / Final submissions:{" "}
                    {mine?.revision ?? 0}
                  </p>
                  <SubmitButton
                    name="finalize"
                    value="false"
                    className="secondary"
                  >
                    Save draft
                  </SubmitButton>{" "}
                  <SubmitButton name="finalize" value="true">
                    Submit final
                  </SubmitButton>
                </form>
              )}
              {teaches &&
                submissions
                  ?.filter((s) => s.assignment_id === a.id)
                  .map((s) => (
                    <details key={s.id}>
                      <summary>
                        Submission {s.user_id.slice(0, 8)} · {s.status}
                      </summary>
                      <p style={{ whiteSpace: "pre-wrap" }}>{s.body}</p>
                      {s.status === "submitted" && (
                        <form action={grade}>
                          <Hidden tenant={tenant} offering={id} />
                          <input type="hidden" name="submission" value={s.id} />
                          <label>
                            Score
                            <input
                              type="number"
                              name="score"
                              min="0"
                              max={a.max_points}
                              step="0.01"
                              required
                              defaultValue={
                                (s.grades as unknown as { points?: number })
                                  ?.points
                              }
                            />
                          </label>
                          <label>
                            Feedback
                            <textarea
                              name="feedback"
                              maxLength={10000}
                              defaultValue={
                                (s.grades as unknown as { feedback?: string })
                                  ?.feedback
                              }
                            />
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              name="publish"
                              defaultChecked={
                                (s.grades as unknown as { published?: boolean })
                                  ?.published
                              }
                            />{" "}
                            Publish to student
                          </label>
                          <SubmitButton>Save grade </SubmitButton>
                        </form>
                      )}
                    </details>
                  ))}
            </article>
          );
        })}
        {!assignments.data?.length && <Empty>No assignments yet.</Empty>}
      </section>
      <section id="assessments" className="card course-section">
        <h2>Quizzes & examinations</h2>
        {assessments?.map((a) => (
          <div className="row" key={a.id}>
            <span>
              {a.kind.toUpperCase()} · {a.title}
            </span>
            <Link href={`/assessments/${a.id}?institution=${tenant}`}>
              Open assessment
              <Icon name="arrow" size={15} />
            </Link>
          </div>
        ))}
        {!assessments?.length && <Empty>No assessments published yet.</Empty>}
      </section>
      {teaches && (
        <section id="teaching" className="course-section">
          <div className="section-heading">
            <h2>Teaching desk</h2>
            <span className="small">
              Assigned faculty & institutional administrators
            </span>
          </div>
          <details>
            <summary>Create quiz or examination</summary>
            <form action={createAssessment}>
              <Hidden tenant={tenant} offering={id} />
              <label>
                Title
                <input name="title" required maxLength={300} />
              </label>
              <label>
                Assessment type
                <select name="kind">
                  <option value="quiz">Quiz</option>
                  <option value="exam">Examination</option>
                </select>
              </label>
              <label>
                Opens (UTC)
                <input name="opens_at" type="datetime-local" required />
              </label>
              <label>
                Closes (UTC)
                <input name="closes_at" type="datetime-local" required />
              </label>
              <label>
                Time limit in minutes
                <input
                  name="minutes"
                  type="number"
                  min="1"
                  max="1440"
                  defaultValue="60"
                  required
                />
              </label>
              <label>
                Attempt limit
                <input
                  name="attempts"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                <input name="randomized" type="checkbox" /> Randomize question
                order
              </label>
              <p className="small">
                Created as a draft. Add questions before publishing.
              </p>
              <SubmitButton>Create assessment </SubmitButton>
            </form>
          </details>
          <details>
            <summary>Upload syllabus or course material</summary>
            <form action={uploadMaterial}>
              <Hidden tenant={tenant} offering={id} />
              <label>
                Title
                <input name="title" required maxLength={300} />
              </label>
              <label>
                File (PDF, TXT, DOCX, PPTX; 10 MB maximum)
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.txt,.docx,.pptx"
                />
              </label>
              <label>
                <input type="checkbox" name="published" /> Publish immediately
              </label>
              <SubmitButton>Upload </SubmitButton>
            </form>
          </details>
          {(
            ["modules", "materials", "announcements", "assignments"] as const
          ).map((kind) => (
            <details key={kind}>
              <summary>
                Add{" "}
                {kind === "materials"
                  ? "reading or resource"
                  : kind.slice(0, -1)}
              </summary>
              <form action={createDelivery}>
                <Hidden tenant={tenant} offering={id} />
                <input type="hidden" name="kind" value={kind} />
                <label>
                  Title
                  <input name="title" required maxLength={300} />
                </label>
                {kind === "materials" ? (
                  <label>
                    Resource URL (HTTPS)
                    <input name="external_url" type="url" required />
                  </label>
                ) : (
                  <label>
                    {kind === "assignments" ? "Instructions" : "Content"}
                    <textarea
                      name={
                        kind === "modules"
                          ? "description"
                          : kind === "assignments"
                            ? "instructions"
                            : "body"
                      }
                      required
                    />
                  </label>
                )}
                {kind === "assignments" && (
                  <>
                    <label>
                      Deadline (UTC)
                      <input name="due_at" type="datetime-local" required />
                    </label>
                    <label>
                      Maximum points
                      <input
                        name="max_points"
                        type="number"
                        min="1"
                        max="10000"
                        defaultValue="100"
                        required
                      />
                    </label>
                  </>
                )}
                <label>
                  <input type="checkbox" name="published" /> Publish immediately
                </label>
                <SubmitButton>Create </SubmitButton>
              </form>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
