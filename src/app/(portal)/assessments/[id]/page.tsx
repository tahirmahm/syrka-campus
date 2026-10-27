import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/lib/session";
import { PageTop, Hidden, Empty } from "@/components/academic";
import {
  addQuestion,
  publishAssessment,
  startAssessment,
} from "@/lib/assessments";
export default async function Assessment({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ institution?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { institution, notice } = await searchParams;
  const { db, membership, user } = await session(institution);
  if (!membership) notFound();
  const tenant = membership.institution_id;
  const { data: a, error } = await db
    .from("assessments")
    .select("*")
    .eq("institution_id", tenant)
    .eq("id", id)
    .maybeSingle();
  if (error || !a) notFound();
  const { data: assignment } = await db
    .from("faculty_assignments")
    .select("id")
    .eq("institution_id", tenant)
    .eq("offering_id", a.offering_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const staff =
    membership.role === "admin" ||
    (membership.role === "faculty" && !!assignment);
  const { data: questions } = staff
    ? await db
        .from("questions")
        .select(
          "id,prompt,kind,points,answer_options(body,position),answer_keys(option_id,expected_answer)",
        )
        .eq("institution_id", tenant)
        .eq("assessment_id", id)
        .order("position")
    : { data: [] };
  const { data: attempts, error: attemptError } = staff
    ? await db
        .from("assessment_attempts")
        .select("id,user_id,started_at,expires_at,finished_at")
        .eq("institution_id", tenant)
        .eq("assessment_id", id)
        .order("started_at")
    : await db.rpc("my_attempts", { tenant, assessment: id });
  if (attemptError) throw new Error("Attempts unavailable");
  return (
    <>
      <PageTop
        label={a.kind.toUpperCase()}
        title={a.title}
        description={`${a.time_limit_minutes ?? "No"} minute limit · ${a.attempt_limit} attempt(s)`}
      />
      <Link href={`/courses/${a.offering_id}?institution=${tenant}`}>
        ← Course
      </Link>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="card">
        <h2>Assessment information</h2>
        <p>
          Available from{" "}
          {new Date(a.opens_at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
          until{" "}
          {new Date(a.closes_at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
          UTC.
        </p>
        <p>
          Save responses regularly. At the deadline, only previously saved
          responses can be submitted. Submitted attempts cannot be changed.
        </p>
        {!staff && (
          <form action={startAssessment}>
            <Hidden tenant={tenant} />
            <input type="hidden" name="assessment" value={id} />
            <button>Start or resume attempt →</button>
          </form>
        )}
      </section>
      <section className="card">
        <h2>{staff ? "Student attempts" : "Your attempts"}</h2>
        {(attempts ?? []).map(
          (attempt: {
            id: string;
            user_id?: string;
            started_at: string;
            expires_at: string;
            finished_at: string | null;
          }) => (
            <div className="row" key={attempt.id}>
              <span>
                {staff ? `${attempt.user_id?.slice(0, 8)} · ` : ""}
                {new Date(attempt.started_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC · {attempt.finished_at ? "Submitted" : "Started"}
              </span>
              <Link href={`/attempts/${attempt.id}?institution=${tenant}`}>
                {staff ? "Review" : "Open"} ↗
              </Link>
            </div>
          ),
        )}
        {!attempts?.length && <Empty>No attempts yet.</Empty>}
      </section>
      {staff && (
        <>
          <section className="card">
            <h2>Publication</h2>
            <form action={publishAssessment}>
              <Hidden tenant={tenant} />
              <input type="hidden" name="assessment" value={id} />
              <label>
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={a.published}
                />{" "}
                Available to enrolled students
              </label>
              <label>
                <input
                  type="checkbox"
                  name="results_published"
                  defaultChecked={a.results_published}
                />{" "}
                Release marked scores and feedback
              </label>
              <button>Save publication →</button>
            </form>
          </section>
          <section className="card">
            <h2>Question bank</h2>
            <p>
              Attempts keep their original questions and answer keys when new
              questions are added.
            </p>
            {questions?.map((q) => (
              <article key={q.id}>
                <h3>{q.prompt}</h3>
                <p>
                  {q.kind} · {q.points} points
                </p>
              </article>
            ))}
            <details>
              <summary>Add question</summary>
              <form action={addQuestion}>
                <Hidden tenant={tenant} />
                <input type="hidden" name="assessment" value={id} />
                <label>
                  Question
                  <textarea name="prompt" required maxLength={10000} />
                </label>
                <label>
                  Type
                  <select name="kind">
                    <option value="single">Multiple choice — one answer</option>
                    <option value="multiple">Multiple select</option>
                    <option value="boolean">True / false</option>
                    <option value="short">Short answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>
                <label>
                  Points
                  <input
                    type="number"
                    name="points"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    defaultValue="10"
                    required
                  />
                </label>
                <label>
                  Answer choices (one per line; true/false requires two choices)
                  <textarea name="options" maxLength={30000} />
                </label>
                <label>
                  Correct choice numbers (comma separated, starting at 1)
                  <input name="correct" placeholder="1, 3" maxLength={100} />
                </label>
                <label>
                  Expected short answer (case insensitive; essays are marked
                  manually)
                  <input name="expected" maxLength={2000} />
                </label>
                <button>Add question →</button>
              </form>
            </details>
          </section>
        </>
      )}
    </>
  );
}
