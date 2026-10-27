import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/lib/session";
import { PageTop, Hidden } from "@/components/academic";
import { saveAttempt, markResponse } from "@/lib/assessments";
type Question = {
  id: string;
  prompt: string;
  kind: string;
  max_points: number;
  options: { id: string; body: string }[];
  response: string | string[] | null;
  points: number | null;
  feedback: string | null;
};
type Attempt = {
  id: string;
  title: string;
  assessment_id: string;
  offering_id: string;
  user_id: string;
  expires_at: string;
  finished_at: string | null;
  expired: boolean;
  staff: boolean;
  results_published: boolean;
  questions: Question[];
};
export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ institution?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { institution, notice } = await searchParams;
  const { db, membership } = await session(institution);
  if (!membership) notFound();
  const tenant = membership.institution_id;
  const { data, error } = await db.rpc("read_attempt", { tenant, attempt: id });
  if (error || !data) notFound();
  const a = data as Attempt;
  const editable = !a.staff && !a.finished_at && !a.expired;
  return (
    <>
      <PageTop
        label="Assessment attempt"
        title={a.title}
        description={`Deadline: ${new Date(a.expires_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC`}
      />
      <Link href={`/assessments/${a.assessment_id}?institution=${tenant}`}>
        Assessment
      </Link>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <p className="notice">
        {a.finished_at
          ? "Attempt submitted."
          : a.expired
            ? "Time expired. Finalize your previously saved responses below."
            : "Save your responses regularly before the deadline."}
      </p>
      <form action={saveAttempt}>
        <Hidden tenant={tenant} />
        <input type="hidden" name="attempt" value={id} />
        <input
          type="hidden"
          name="questions"
          value={JSON.stringify(
            Object.fromEntries(a.questions.map((q) => [q.id, q.kind])),
          )}
        />
        {a.questions.map((q, index) => (
          <section className="card" key={q.id}>
            <p className="eyebrow">
              QUESTION {index + 1} / {q.max_points} POINTS
            </p>
            <fieldset disabled={!editable}>
              <legend>{q.prompt}</legend>
              {["single", "multiple", "boolean"].includes(q.kind) ? (
                q.options.map((o) => (
                  <label key={o.id}>
                    <input
                      type={q.kind === "multiple" ? "checkbox" : "radio"}
                      name={`answer-${q.id}`}
                      value={o.id}
                      defaultChecked={
                        Array.isArray(q.response) && q.response.includes(o.id)
                      }
                    />{" "}
                    {o.body}
                  </label>
                ))
              ) : (
                <label>
                  Your answer
                  <textarea
                    name={`answer-${q.id}`}
                    defaultValue={
                      typeof q.response === "string" ? q.response : ""
                    }
                    maxLength={100000}
                    rows={q.kind === "essay" ? 8 : 3}
                  />
                </label>
              )}
            </fieldset>
            {a.results_published && (
              <p>
                Score: {q.points ?? "Awaiting marking"}
                {q.points !== null ? ` / ${q.max_points}` : ""}
                {q.feedback && ` · ${q.feedback}`}
              </p>
            )}
          </section>
        ))}
        {!a.staff && !a.finished_at && (
          <div className="toolbar">
            {editable && (
              <SubmitButton name="finalize" value="false">
                Save responses
              </SubmitButton>
            )}
            <SubmitButton name="finalize" value="true">
              {a.expired
                ? "Finalize saved responses"
                : "Submit final attempt"}{" "}
            </SubmitButton>
          </div>
        )}
      </form>
      {a.staff && a.finished_at && (
        <section>
          <h2>Marking desk</h2>
          {a.questions.map((q) => (
            <details key={q.id}>
              <summary>
                {q.prompt} · {q.points ?? "Unmarked"} / {q.max_points}
              </summary>
              <form action={markResponse}>
                <Hidden tenant={tenant} />
                <input type="hidden" name="attempt" value={id} />
                <input type="hidden" name="question" value={q.id} />
                <label>
                  Score
                  <input
                    name="points"
                    type="number"
                    min="0"
                    max={q.max_points}
                    step="0.01"
                    defaultValue={q.points ?? undefined}
                    required
                  />
                </label>
                <label>
                  Feedback
                  <textarea
                    name="feedback"
                    maxLength={10000}
                    defaultValue={q.feedback ?? ""}
                  />
                </label>
                <SubmitButton>Save mark </SubmitButton>
              </form>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
