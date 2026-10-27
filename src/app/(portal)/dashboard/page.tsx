import Link from "next/link";
import { session } from "@/lib/session";
import { currentCourses } from "@/lib/academic-read";
import { PageTop, CourseCard, Empty, DateChip } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const context = await session(institution);
  const { db, membership } = context;
  if (!membership)
    return (
      <>
        <PageTop
          label="Welcome to Campus"
          title="Your academic workspace"
          description="Ask your institution to activate your Campus membership."
        />
        <section className="card">
          <Empty>No active institutional membership.</Empty>
        </section>
      </>
    );
  const tenant = membership.institution_id;
  const [
    courses,
    assignments,
    announcements,
    exams,
    events,
    grades,
    submissions,
  ] = await Promise.all([
    currentCourses(context, 6),
    db
      .from("assignments")
      .select("id,title,due_at,offering_id,offerings(courses(code))")
      .eq("institution_id", tenant)
      .eq("published", true)
      .gte("due_at", new Date().toISOString())
      .order("due_at")
      .limit(50),
    db
      .from("announcements")
      .select("id,title,body")
      .eq("institution_id", tenant)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("assessments")
      .select("id,title,kind,opens_at,closes_at,time_limit_minutes")
      .eq("institution_id", tenant)
      .eq("published", true)
      .gte("closes_at", new Date().toISOString())
      .order("opens_at")
      .limit(3),
    db
      .from("calendar_events")
      .select("id,title,starts_at,offering_id")
      .eq("institution_id", tenant)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
    db
      .from("grades")
      .select("id,points,feedback,submissions(assignments(title,max_points))")
      .eq("institution_id", tenant)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(3),
    membership.role === "student"
      ? db
          .from("submissions")
          .select("assignment_id,status")
          .eq("institution_id", tenant)
          .eq("user_id", context.user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (
    [assignments, announcements, exams, events, grades, submissions].some(
      (r) => r.error,
    )
  )
    throw new Error("Academic information could not be loaded.");
  const upcoming = (assignments.data ?? [])
    .filter(
      (a) =>
        !submissions.data?.some(
          (s) => s.assignment_id === a.id && s.status === "submitted",
        ),
    )
    .slice(0, 5);
  const terms = [
    ...new Set(
      courses
        .map(
          (c) => (c.academic_terms as unknown as { name: string } | null)?.name,
        )
        .filter(Boolean),
    ),
  ];
  return (
    <>
      <PageTop
        label={terms.join(" · ") || "Your academic workspace"}
        title="Dashboard"
        description={
          membership.role === "student"
            ? "Your courses, upcoming work and latest academic updates."
            : membership.role === "faculty"
              ? "Your teaching, upcoming assessments and academic activity."
              : "A clear view of your institution’s academic activity."
        }
      />
      <div className="summary-strip" aria-label="Academic overview">
        <div className="summary-item">
          <Icon name="book" />
          <strong>{courses.length}</strong>
          <span>
            {membership.role === "faculty"
              ? "Teaching courses"
              : "Courses in view"}
          </span>
        </div>
        <div className="summary-item">
          <Icon name="assignment" />
          <strong>{upcoming.length}</strong>
          <span>Upcoming assignments</span>
        </div>
        <div className="summary-item">
          <Icon name="assessment" />
          <strong>{exams.data?.length ?? 0}</strong>
          <span>Assessments in view</span>
        </div>
      </div>
      <div className="dashboard-layout">
        <div className="dashboard-primary">
          <section>
            <div className="section-heading">
              <h2>
                {membership.role === "faculty"
                  ? "Your teaching courses"
                  : "Your courses"}
              </h2>
              <Link
                className="text-link"
                href={`/my-courses?institution=${tenant}`}
              >
                View all
                <Icon name="arrow" size={14} />
              </Link>
            </div>
            <div className="grid">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} tenant={tenant} />
              ))}
            </div>
            {!courses.length && (
              <section className="card">
                <Empty>
                  {membership.role === "student"
                    ? "No courses are registered yet. Visit the catalog to explore your institution’s offerings."
                    : "No course offerings are available yet."}
                </Empty>
              </section>
            )}
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Upcoming assignments</h2>
              <Link
                className="text-link"
                href={`/assignments?institution=${tenant}`}
              >
                All assignments
                <Icon name="arrow" size={14} />
              </Link>
            </div>
            {upcoming.map((a) => {
              const course = (
                a.offerings as unknown as {
                  courses: { code: string } | null;
                } | null
              )?.courses;
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
                      {course?.code ?? "Course assignment"} · Due{" "}
                      {new Date(a.due_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </p>
                  </div>
                  <Link
                    className="quiet"
                    aria-label={`Open assignment ${a.title}`}
                    href={`/courses/${a.offering_id}?institution=${tenant}#assignment-${a.id}`}
                  >
                    <Icon name="next" size={16} />
                  </Link>
                </div>
              );
            })}
            {!upcoming.length && (
              <Empty>
                No upcoming assignments. Your published deadlines will appear
                here.
              </Empty>
            )}
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Quizzes & examinations</h2>
              <Link
                className="text-link"
                href={`/assessments?institution=${tenant}`}
              >
                View all
                <Icon name="arrow" size={14} />
              </Link>
            </div>
            {exams.data?.map((a) => (
              <div className="list-item" key={a.id}>
                <span
                  className="list-icon"
                  style={{ background: "var(--lavender)", color: "#75658f" }}
                >
                  <Icon name="assessment" />
                </span>
                <div>
                  <Link href={`/assessments/${a.id}?institution=${tenant}`}>
                    {a.title}
                  </Link>
                  <p>
                    {a.kind === "exam" ? "Examination" : "Quiz"}
                    {a.time_limit_minutes
                      ? ` · ${a.time_limit_minutes} minutes`
                      : ""}{" "}
                    · Closes{" "}
                    {new Date(a.closes_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>
                <Link
                  className="quiet"
                  aria-label={`Open assessment ${a.title}`}
                  href={`/assessments/${a.id}?institution=${tenant}`}
                >
                  <Icon name="next" size={16} />
                </Link>
              </div>
            ))}
            {!exams.data?.length && <Empty>No upcoming assessments.</Empty>}
          </section>
        </div>
        <div className="dashboard-secondary">
          <section className="card">
            <div className="section-heading">
              <h2>Announcements</h2>
              <Icon name="info" size={16} />
            </div>
            {announcements.data?.map((a) => (
              <article className="announcement" key={a.id}>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </article>
            ))}
            {!announcements.data?.length && (
              <Empty>No new announcements.</Empty>
            )}
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>On your calendar</h2>
              <Link
                className="text-link"
                href={`/calendar?institution=${tenant}`}
                aria-label="Open calendar"
              >
                <Icon name="calendar" size={16} />
              </Link>
            </div>
            {events.data?.map((e) => (
              <div className="list-item" key={e.id}>
                <DateChip value={e.starts_at} />
                <div>
                  {e.offering_id ? (
                    <Link
                      href={`/courses/${e.offering_id}/records?institution=${tenant}`}
                    >
                      {e.title}
                    </Link>
                  ) : (
                    <strong>{e.title}</strong>
                  )}
                  <p>
                    {new Date(e.starts_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </p>
                </div>
              </div>
            ))}
            {!events.data?.length && <Empty>No upcoming events.</Empty>}
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>
                {membership.role === "student"
                  ? "Recent feedback"
                  : "Published feedback"}
              </h2>
              <Link
                className="text-link"
                href={`/grades?institution=${tenant}`}
                aria-label="Open grades"
              >
                <Icon name="grade" size={16} />
              </Link>
            </div>
            {grades.data?.map((g) => {
              const assignment = (
                g.submissions as unknown as {
                  assignments: { title: string; max_points: number } | null;
                } | null
              )?.assignments;
              return (
                <div className="list-item" key={g.id}>
                  <span
                    className="list-icon"
                    style={{ background: "var(--apricot)", color: "#8b6346" }}
                  >
                    <Icon name="grade" size={17} />
                  </span>
                  <div>
                    <strong>
                      {assignment?.title ?? "Published assessment"}
                    </strong>
                    <p>
                      {g.points}
                      {assignment ? ` / ${assignment.max_points}` : " points"}
                    </p>
                    {g.feedback && <p>{g.feedback}</p>}
                  </div>
                </div>
              );
            })}
            {!grades.data?.length && (
              <Empty>
                Your published scores and feedback will appear here.
              </Empty>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
