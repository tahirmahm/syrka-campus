import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/lib/session";
import { PageTop, Hidden, Empty } from "@/components/academic";
import { saveRecord } from "@/lib/records";
export default async function Records({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ institution?: string }>;
}) {
  const { id } = await params;
  const { institution } = await searchParams;
  const { db, membership, user } = await session(institution);
  if (!membership) notFound();
  const tenant = membership.institution_id;
  const { data: offering } = await db
    .from("offerings")
    .select("id,courses(code,title)")
    .eq("institution_id", tenant)
    .eq("id", id)
    .maybeSingle();
  if (!offering) notFound();
  const { data: assigned } = await db
    .from("faculty_assignments")
    .select("id")
    .eq("institution_id", tenant)
    .eq("offering_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const staff =
    membership.role === "admin" ||
    (membership.role === "faculty" && !!assigned);
  const tables = [
    "attendance",
    "calendar_events",
    "grade_categories",
    "course_grades",
    "enrollments",
    "assignments",
    "assessments",
  ] as const;
  const results = await Promise.all(
    tables.map((t) =>
      db
        .from(t)
        .select("*")
        .eq("institution_id", tenant)
        .eq("offering_id", id)
        .limit(200),
    ),
  );
  if (results.some((r) => r.error))
    throw new Error("Academic records unavailable");
  const [
    attendance,
    events,
    categories,
    grades,
    enrollments,
    assignments,
    assessments,
  ] = results.map((r) => r.data ?? []);
  const c = offering.courses as unknown as { code: string; title: string };
  const students = enrollments.filter((e) =>
    ["enrolled", "completed"].includes(e.status),
  );
  const { data: items, error: itemError } = await db
    .from("grade_items")
    .select("id,title,category_id")
    .eq("institution_id", tenant)
    .in(
      "category_id",
      categories.map((c) => c.id),
    );
  if (itemError) throw new Error("Grade items unavailable");
  return (
    <>
      <PageTop
        label={`${c.code} · Course records`}
        title="Academic records"
        description={c.title}
      />
      <Link href={`/courses/${id}?institution=${tenant}`}> Course</Link>
      {staff && (
        <p>
          <a href={`/cam/courses/${id}/export?institution=${tenant}`}>
            Export authorized gradebook CSV
          </a>
        </p>
      )}
      <section className="card">
        <h2>Course results</h2>
        <p>
          Categories must total 100%. Items within each category are equally
          weighted. Assessment items use the highest fully marked submitted
          attempt. All items must be marked before a final result can be
          calculated.
        </p>
        {categories.map((c) => (
          <div key={c.id}>
            <strong>
              {c.name} · {Number(c.weight) * 100}%
            </strong>
            <ul>
              {items
                ?.filter((i) => i.category_id === c.id)
                .map((i) => (
                  <li key={i.id}>{i.title}</li>
                ))}
            </ul>
          </div>
        ))}
        {grades.map((g) => (
          <div className="row" key={g.id}>
            <span>
              {staff ? `${g.user_id.slice(0, 8)} · ` : ""}
              {g.percentage}% · {g.feedback}
            </span>
            <span>{g.published ? "Published" : "Draft"}</span>
          </div>
        ))}
        {!grades.length && <Empty>No course results published yet.</Empty>}
      </section>
      <section className="card">
        <h2>Attendance</h2>
        {attendance.map((a) => (
          <div className="row" key={a.id}>
            <span>
              {a.session_date} · {staff ? `${a.user_id.slice(0, 8)} · ` : ""}
              {a.status}
            </span>
          </div>
        ))}
        {!attendance.length && <Empty>No attendance records.</Empty>}
      </section>
      <section className="card">
        <h2>Course calendar</h2>
        {events.map((e) => (
          <div key={e.id}>
            <strong>{e.title}</strong>
            <p>
              {new Date(e.starts_at).toLocaleString("en-GB", {
                timeZone: "UTC",
              })}{" "}
              —{" "}
              {new Date(e.ends_at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
              UTC
            </p>
          </div>
        ))}
        {!events.length && <Empty>No events scheduled.</Empty>}
      </section>
      {staff && (
        <section>
          <h2>Records desk</h2>
          {[
            "attendance",
            "calendar_events",
            "grade_categories",
            "grade_items",
            "course_grades",
          ].map((kind) => (
            <details key={kind}>
              <summary>
                {
                  {
                    attendance: "Record attendance",
                    calendar_events: "Add calendar event",
                    grade_categories: "Add grading category",
                    grade_items: "Add grade item",
                    course_grades: "Calculate course result",
                  }[kind]
                }
              </summary>
              <form action={saveRecord}>
                <Hidden tenant={tenant} offering={id} />
                <input type="hidden" name="kind" value={kind} />
                {["attendance", "course_grades"].includes(kind) && (
                  <label>
                    Student
                    <select name="user_id" required>
                      <option value="">Select student…</option>
                      {students.map((e) => (
                        <option key={e.id} value={e.user_id}>
                          {e.user_id}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {kind === "attendance" && (
                  <>
                    <label>
                      Session date
                      <input name="date" type="date" required />
                    </label>
                    <label>
                      Status
                      <select name="status">
                        <option>present</option>
                        <option>absent</option>
                        <option>excused</option>
                        <option>late</option>
                      </select>
                    </label>
                  </>
                )}
                {[
                  "calendar_events",
                  "grade_categories",
                  "grade_items",
                ].includes(kind) && (
                  <label>
                    {kind === "grade_categories" ? "Category name" : "Title"}
                    <input name="title" required maxLength={300} />
                  </label>
                )}
                {kind === "calendar_events" && (
                  <>
                    <label>
                      Starts (UTC)
                      <input name="starts_at" type="datetime-local" required />
                    </label>
                    <label>
                      Ends (UTC)
                      <input name="ends_at" type="datetime-local" required />
                    </label>
                  </>
                )}
                {kind === "grade_categories" && (
                  <label>
                    Weight (%)
                    <input
                      name="weight"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </label>
                )}
                {kind === "grade_items" && (
                  <>
                    <label>
                      Category
                      <select name="category" required>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Source
                      <select name="source">
                        <option value="assignment">Assignment</option>
                        <option value="assessment">Quiz / exam</option>
                      </select>
                    </label>
                    <label>
                      Assignment (when selected)
                      <select name="assignment">
                        <option value="">Select…</option>
                        {assignments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Quiz / exam (when selected)
                      <select name="assessment">
                        <option value="">Select…</option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {kind === "course_grades" && (
                  <>
                    <label>
                      Feedback
                      <textarea name="feedback" maxLength={10000} />
                    </label>
                    <label>
                      <input name="publish" type="checkbox" /> Publish result to
                      student
                    </label>
                  </>
                )}
                <SubmitButton>Save </SubmitButton>
              </form>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
