import Link from "next/link";
import { session } from "@/lib/session";
import { currentCourses } from "@/lib/academic-read";
import { PageTop, CourseCard, Empty } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function MyCourses({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const context = await session(institution);
  const { membership } = context;
  if (!membership) return <Empty>No institution selected.</Empty>;
  const courses = await currentCourses(context);
  const title =
    membership.role === "faculty"
      ? "Teaching courses"
      : membership.role === "admin"
        ? "Course offerings"
        : "My courses";
  return (
    <>
      <PageTop
        label="Your academic workspace"
        title={title}
        description={
          membership.role === "student"
            ? "The courses you are enrolled in, with their materials, assignments and academic records."
            : "Open a course to manage its learning materials, assessments and academic records."
        }
      />
      <div className="section-heading">
        <p className="small">
          {courses.length} course{courses.length === 1 ? "" : "s"}
        </p>
        {membership.role !== "faculty" && (
          <Link
            className="text-link"
            href={`/courses?institution=${membership.institution_id}`}
          >
            Browse catalog
            <Icon name="arrow" size={15} />
          </Link>
        )}
      </div>
      <div className="grid">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            tenant={membership.institution_id}
          />
        ))}
      </div>
      {!courses.length && (
        <div className="empty-panel">
          <Empty>
            {membership.role === "student"
              ? "You have not registered for a course yet. Browse the catalog to find your next course."
              : "No course offerings are assigned or available yet."}
          </Empty>
        </div>
      )}
    </>
  );
}
