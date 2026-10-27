import Link from "next/link";
import { session } from "@/lib/session";
import { PageTop, Empty, Status } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function Assessments({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const { data, error } = await db
    .from("assessments")
    .select(
      "id,title,kind,opens_at,closes_at,time_limit_minutes,attempt_limit,published,offerings(courses(code,title))",
    )
    .eq("institution_id", tenant)
    .order("opens_at")
    .limit(200);
  if (error) throw new Error("Assessments unavailable");
  return (
    <>
      <PageTop
        label="Academic assessments"
        title="Quizzes & examinations"
        description="Check availability and assessment rules before starting an attempt."
      />
      <section className="card">
        {data?.map((a) => {
          const course = (
            a.offerings as unknown as {
              courses: { code: string } | null;
            } | null
          )?.courses;
          return (
            <div className="list-item" key={a.id}>
              <span className="list-icon">
                <Icon name="assessment" />
              </span>
              <div>
                <Link href={`/assessments/${a.id}?institution=${tenant}`}>
                  {a.title}
                </Link>
                <p>
                  {course?.code ?? "Course"} ·{" "}
                  {a.kind === "exam" ? "Examination" : "Quiz"} ·{" "}
                  {a.time_limit_minutes
                    ? `${a.time_limit_minutes} minute limit`
                    : "No time limit"}{" "}
                  · {a.attempt_limit} attempt{a.attempt_limit === 1 ? "" : "s"}{" "}
                  allowed
                </p>
                <p>
                  {new Date(a.opens_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  –{" "}
                  {new Date(a.closes_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </p>
                {membership.role !== "student" && (
                  <Status published={a.published} />
                )}
              </div>
              <Link
                className="quiet"
                aria-label={`Open assessment ${a.title}`}
                href={`/assessments/${a.id}?institution=${tenant}`}
              >
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          );
        })}
        {!data?.length && (
          <Empty>
            No assessments have been published for your courses yet.
          </Empty>
        )}
      </section>
    </>
  );
}
