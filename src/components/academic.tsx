import Link from "next/link";
import { switchInstitution } from "@/lib/actions";
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
  return <div className="empty">{children}</div>;
}
export function TenantPicker({
  memberships,
  current,
}: {
  memberships: {
    institution_id: string;
    role: string;
    institutions: unknown;
  }[];
  current?: string;
}) {
  return (
    <form action={switchInstitution} className="toolbar">
      <label>
        Institution
        <select name="institution" defaultValue={current}>
          {memberships.map((m) => (
            <option key={m.institution_id} value={m.institution_id}>
              {(m.institutions as { name?: string })?.name ?? m.institution_id}{" "}
              · {m.role}
            </option>
          ))}
        </select>
      </label>
      <button>Switch →</button>
    </form>
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
    <article className="card">
      <div className="card-top">
        <span className="eyebrow">
          {c.code} / {course.section}
        </span>
        <span className="pill">{c.credits} credits</span>
      </div>
      <h3>{c.title}</h3>
      <p>{c.description}</p>
      <div className="row">
        <span className="small">{term.name}</span>
        <Link href={`/courses/${course.id}?institution=${tenant}`}>
          Open course ↗
        </Link>
      </div>
    </article>
  );
}
