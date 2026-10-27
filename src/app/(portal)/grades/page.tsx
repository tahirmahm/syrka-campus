import { session } from "@/lib/session";
import { PageTop, Empty, Status } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function Grades({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const [results, finalResults, categories] = await Promise.all([
    db
      .from("grades")
      .select(
        "id,points,feedback,published,submissions(user_id,assignments(title,max_points,offerings(courses(code))))",
      )
      .eq("institution_id", tenant),
    db
      .from("course_grades")
      .select(
        "id,user_id,percentage,feedback,published,offerings(courses(code,title))",
      )
      .eq("institution_id", tenant),
    db
      .from("grade_categories")
      .select("id,name,weight,offerings(courses(code))")
      .eq("institution_id", tenant),
  ]);
  if ([results, finalResults, categories].some((r) => r.error))
    throw new Error("Academic results unavailable");
  return (
    <>
      <PageTop
        label="Academic records"
        title={
          membership.role === "student"
            ? "Grades & feedback"
            : "Gradebooks & published records"
        }
        description={
          membership.role === "student"
            ? "Your published scores, course results and feedback. Unreleased results remain private."
            : "Review authorized academic results. Draft grades remain visible only to authorized staff."
        }
      />
      <section className="card">
        <div className="section-heading">
          <h2>Final course results</h2>
          <Icon name="grade" size={18} />
        </div>
        {finalResults.data?.map((g) => {
          const c = (
            g.offerings as unknown as {
              courses: { code: string; title: string } | null;
            } | null
          )?.courses;
          return (
            <div className="grade-summary" key={g.id}>
              <div>
                <p className="eyebrow">{c?.code ?? "Course result"}</p>
                <h3>{c?.title ?? "Academic result"}</h3>
                <p>{g.feedback}</p>
                {membership.role !== "student" && (
                  <p className="small">
                    Student reference: {g.user_id.slice(0, 8)}
                  </p>
                )}
                <Status published={g.published} />
              </div>
              <span className="score">
                {g.percentage}
                <small>%</small>
              </span>
            </div>
          );
        })}
        {!finalResults.data?.length && (
          <Empty>No final course results have been published yet.</Empty>
        )}
      </section>
      <section>
        <div className="section-heading">
          <h2>Assessment scores</h2>
          <span className="small">Points and instructor feedback</span>
        </div>
        <div
          className="table-wrap"
          role="region"
          aria-label="Assessment scores"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">
              Authorized assessment scores and publication status
            </caption>
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                <th scope="col">Score</th>
                <th scope="col">Feedback</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.data?.map((g) => {
                const submission = g.submissions as unknown as {
                  user_id: string;
                  assignments: {
                    title: string;
                    max_points: number;
                    offerings: { courses: { code: string } | null } | null;
                  } | null;
                } | null;
                const a = submission?.assignments;
                return (
                  <tr key={g.id}>
                    <td>
                      <strong>{a?.title ?? "Published assessment"}</strong>
                      <div className="small">
                        {a?.offerings?.courses?.code}
                        {membership.role !== "student" && submission
                          ? ` · ${submission.user_id.slice(0, 8)}`
                          : ""}
                      </div>
                    </td>
                    <td>
                      <strong>{g.points}</strong>
                      {a ? ` / ${a.max_points}` : " points"}
                    </td>
                    <td>{g.feedback || "No written feedback."}</td>
                    <td>
                      <Status published={g.published} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!results.data?.length && (
            <Empty>No published assessment grades yet.</Empty>
          )}
        </div>
      </section>
      <section className="card">
        <h2>Assessment weighting</h2>
        <p>
          Grade categories are set by your institution. Items within a category
          are equally weighted.
        </p>
        {categories.data?.map((c) => (
          <div className="row" key={c.id}>
            <span>
              {
                (
                  c.offerings as unknown as {
                    courses: { code: string } | null;
                  } | null
                )?.courses?.code
              }{" "}
              · {c.name}
            </span>
            <span className="pill">{Number(c.weight) * 100}%</span>
          </div>
        ))}
        {!categories.data?.length && (
          <Empty>No grading categories have been configured yet.</Empty>
        )}
      </section>
    </>
  );
}
