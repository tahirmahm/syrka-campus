import { notFound } from "next/navigation";
import { session } from "@/lib/session";
import { PageTop, Hidden, Empty } from "@/components/academic";
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
        .order("created_at"),
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
  const c = offering.courses as unknown as {
    code: string;
    title: string;
    description: string;
    credits: number;
  };
  return (
    <>
      <PageTop
        label={`${c.code} / SECTION ${offering.section}`}
        title={c.title}
        description={`${c.credits} credits · ${(offering.academic_terms as unknown as { name: string }).name}`}
      />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="card">
        <p className="eyebrow">OVERVIEW / SYLLABUS</p>
        <p>{c.description}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {offering.syllabus || "The syllabus has not been added yet."}
        </p>
      </section>
      <section>
        <h2>Your learning path</h2>
        {modules.data?.map((m) => (
          <article className="card" key={m.id}>
            <p className="eyebrow">{m.published ? "PUBLISHED" : "DRAFT"}</p>
            <h3>{m.title}</h3>
            <p>{m.description}</p>
          </article>
        ))}
        {!modules.data?.length && <Empty>No modules published yet.</Empty>}
      </section>
      <section className="grid">
        <article className="card">
          <h3>Readings & resources</h3>
          {materials.data?.map((m) => (
            <div className="row" key={m.id}>
              {m.external_url ? (
                <a
                  href={m.external_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {m.title} ↗
                </a>
              ) : (
                <a href={`/campus/files/${m.id}?institution=${tenant}`}>
                  {m.title} ↓
                </a>
              )}
            </div>
          ))}
          {!materials.data?.length && <p>No materials yet.</p>}
        </article>
        <article className="card">
          <h3>Course announcements</h3>
          {announcements.data?.map((a) => (
            <div key={a.id}>
              <strong>{a.title}</strong>
              <p>{a.body}</p>
            </div>
          ))}
          {!announcements.data?.length && <p>No announcements yet.</p>}
        </article>
      </section>
      <section>
        <h2>Assignments</h2>
        {assignments.data?.map((a) => {
          const mine = submissions?.find(
            (s) => s.assignment_id === a.id && s.user_id === user.id,
          );
          return (
            <article className="card" key={a.id}>
              <p className="eyebrow">
                {a.published ? "PUBLISHED" : "DRAFT"} / {a.max_points} POINTS
              </p>
              <h3>{a.title}</h3>
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
                  <button name="finalize" value="false">
                    Save draft
                  </button>{" "}
                  <button name="finalize" value="true">
                    Submit final →
                  </button>
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
                          <button>Save grade →</button>
                        </form>
                      )}
                    </details>
                  ))}
            </article>
          );
        })}
        {!assignments.data?.length && <Empty>No assignments yet.</Empty>}
      </section>
      {teaches && (
        <section>
          <h2>Teaching desk</h2>
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
              <button>Upload →</button>
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
                <button>Create →</button>
              </form>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
