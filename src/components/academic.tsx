import Link from "next/link";
import { Icon } from "./icon";
export function PageTop({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-top">
      <div>
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Hidden({
  tenant,
  offering,
}: {
  tenant: string;
  offering?: string;
}) {
  return (
    <>
      <input type="hidden" name="tenant" value={tenant} />
      {offering && <input type="hidden" name="offering" value={offering} />}
    </>
  );
}
export function CourseCard({
  course,
  tenant,
}: {
  course: {
    id: string;
    section: string;
    capacity: number;
    courses: unknown;
    academic_terms: unknown;
  };
  tenant: string;
}) {
  const c = course.courses as {
    code: string;
    title: string;
    credits: number;
    description: string;
  };
  const term = course.academic_terms as { name: string };
  return (
    <article className="card course-card">
      <div className="card-top">
        <span className="eyebrow">
          {c.code} · Section {course.section}
        </span>
        <span className="pill">{c.credits} credits</span>
      </div>
      <div className="course-symbol">
        <Icon name="book" size={18} />
      </div>
      <h3>{c.title}</h3>
      <p className="course-description">{c.description}</p>
      <p className="course-meta">
        <Icon name="calendar" size={13} />
        {term.name}
      </p>
      <div className="row">
        <span className="small">Capacity {course.capacity}</span>
        <Link
          className="text-link"
          href={`/courses/${course.id}?institution=${tenant}`}
        >
          Open course
          <Icon name="arrow" size={15} />
        </Link>
      </div>
    </article>
  );
}
export function Status({ published }: { published: boolean }) {
  return (
    <span
      className={`status ${published ? "status-published" : "status-draft"}`}
    >
      <Icon name={published ? "check" : "clock"} size={12} />
      {published ? "Published" : "Draft"}
    </span>
  );
}
export function DateChip({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <div
      className="date-chip"
      aria-label={date.toLocaleDateString("en-GB", { timeZone: "UTC" })}
    >
      <strong>
        {date.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "UTC" })}
      </strong>
      <span>
        {date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
      </span>
    </div>
  );
}
