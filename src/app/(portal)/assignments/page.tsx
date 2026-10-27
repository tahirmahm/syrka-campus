import Link from "next/link";
import { session } from "@/lib/session";
import { PageTop, Empty, Status, DateChip } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function Assignments({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, user, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const { data, error } = await db
    .from("assignments")
    .select(
      "id,title,due_at,max_points,published,offering_id,offerings(courses(code,title))",
    )
    .eq("institution_id", tenant)
    .order("due_at")
    .limit(200);
  if (error) throw new Error("Assignments unavailable");
  const { data: submissions, error: submissionError } =
    membership.role === "student"
      ? await db
          .from("submissions")
          .select("assignment_id,status")
          .eq("institution_id", tenant)
          .eq("user_id", user.id)
      : { data: [], error: null };
  if (submissionError) throw new Error("Submission status unavailable");
  return (
    <>
      <PageTop
        label={
          membership.role === "student" ? "Your learning" : "Teaching workspace"
        }
        title={
          membership.role === "student"
            ? "Assignments"
            : "Submissions & assignments"
        }
        description="Deadlines, instructions and submission status across your authorized courses."
      />
      <section className="card">
        {data?.map((a) => {
          const course = (
            a.offerings as unknown as {
              courses: { code: string; title: string } | null;
            } | null
          )?.courses;
          const status = submissions?.find(
            (s) => s.assignment_id === a.id,
          )?.status;
          return (
            <div className="list-item" key={a.id}>
              <DateChip value={a.due_at} />
              <div>
                <Link
                  href={`/courses/${a.offering_id}?institution=${tenant}#assignment-${a.id}`}
                >
                  {a.title}
                </Link>
                <p>
                  {course?.code ?? "Course"} · Due{" "}
                  {new Date(a.due_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC · {a.max_points} points
                </p>
                <p>
                  {membership.role === "student" ? (
                    <span className="status">
                      {status === "submitted"
                        ? "Submitted"
                        : status === "draft"
                          ? "Draft saved"
                          : "Not started"}
                    </span>
                  ) : (
                    <Status published={a.published} />
                  )}
                </p>
              </div>
              <Link
                className="quiet"
                aria-label={`Open assignment ${a.title}`}
                href={`/courses/${a.offering_id}?institution=${tenant}#assignment-${a.id}`}
              >
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          );
        })}
        {!data?.length && (
          <Empty>
            No assignments have been published for your courses yet.
          </Empty>
        )}
      </section>
    </>
  );
}
