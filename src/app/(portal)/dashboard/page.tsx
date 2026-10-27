import Link from "next/link";
import { session } from "@/lib/session";
import {
  PageTop,
  TenantPicker,
  CourseCard,
  Empty,
} from "@/components/academic";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, memberships, membership } = await session(institution);
  if (!membership)
    return (
      <>
        <PageTop
          label="WELCOME"
          title="Your next chapter starts here."
          description="Ask your institution to activate your Campus membership."
        />
        <Empty>No active institutional membership.</Empty>
      </>
    );
  const tenant = membership.institution_id;
  const [courses, assignments, announcements] = await Promise.all([
    db
      .from("offerings")
      .select(
        "id,section,capacity,courses(code,title,description,credits),academic_terms(name)",
      )
      .eq("institution_id", tenant)
      .limit(6),
    db
      .from("assignments")
      .select("id,title,due_at,offering_id")
      .eq("institution_id", tenant)
      .gte("due_at", new Date().toISOString())
      .order("due_at")
      .limit(5),
    db
      .from("announcements")
      .select("id,title,body")
      .eq("institution_id", tenant)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);
  if (courses.error || assignments.error || announcements.error)
    throw new Error("Academic information could not be loaded.");
  return (
    <>
      <PageTop
        label="YOUR ACADEMIC DIRECTION"
        title="Room to learn. Space to grow."
        description="A clear view of what comes next."
      />
      <TenantPicker memberships={memberships} current={tenant} />
      <section>
        <div className="row">
          <h3>Explore your courses</h3>
          <Link href={`/courses?institution=${tenant}`}>All courses ↗</Link>
        </div>
        <div className="grid">
          {courses.data?.map((c) => (
            <CourseCard key={c.id} course={c} tenant={tenant} />
          ))}
        </div>
        {!courses.data?.length && (
          <Empty>No courses have been published yet.</Empty>
        )}
      </section>
      <section className="grid">
        <article className="card">
          <p className="eyebrow">NEXT / DEADLINES</p>
          <h3>Coming into view</h3>
          {assignments.data?.map((a) => (
            <div className="row" key={a.id}>
              <Link href={`/courses/${a.offering_id}?institution=${tenant}`}>
                {a.title} ↗
              </Link>
              <span className="small">
                {new Date(a.due_at).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                })}
              </span>
            </div>
          ))}
          {!assignments.data?.length && <p>No upcoming assignments.</p>}
        </article>
        <article className="card">
          <p className="eyebrow">FROM YOUR COMMUNITY</p>
          <h3>Announcements</h3>
          {announcements.data?.map((a) => (
            <div key={a.id}>
              <strong>{a.title}</strong>
              <p>{a.body}</p>
            </div>
          ))}
          {!announcements.data?.length && <p>No announcements yet.</p>}
        </article>
      </section>
    </>
  );
}
