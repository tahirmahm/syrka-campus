import { z } from "zod";
import { session } from "@/lib/session";
import { PageTop, CourseCard, Empty } from "@/components/academic";
import { Icon } from "@/components/icon";
export default async function Courses({
  searchParams,
}: {
  searchParams: Promise<{
    institution?: string;
    q?: string;
    term?: string;
    department?: string;
  }>;
}) {
  const {
    institution,
    q: raw = "",
    term = "",
    department = "",
  } = await searchParams;
  const q = raw.slice(0, 200);
  const { db, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const [terms, departments] = await Promise.all([
    db.from("academic_terms").select("id,name").eq("institution_id", tenant),
    db.from("departments").select("id,name").eq("institution_id", tenant),
  ]);
  if (terms.error || departments.error)
    throw new Error("Course filters unavailable");
  let query = db
    .from("offerings")
    .select(
      "id,section,capacity,courses!inner(code,title,description,credits,department_id),academic_terms(name)",
    )
    .eq("institution_id", tenant);
  if (z.uuid().safeParse(term).success) query = query.eq("term_id", term);
  if (z.uuid().safeParse(department).success)
    query = query.eq("courses.department_id", department);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Course catalog unavailable");
  const results = data?.filter((c) => {
    const course = c.courses as unknown as { code: string; title: string };
    return `${course.code} ${course.title}`
      .toLowerCase()
      .includes(q.toLowerCase());
  });
  return (
    <>
      <PageTop
        label="Explore your institution"
        title="Course catalog"
        description="Find a course, compare academic offerings and plan your next term."
      />
      <form className="toolbar filter-bar">
        <input type="hidden" name="institution" value={tenant} />
        <label>
          Search courses
          <input
            name="q"
            defaultValue={q}
            placeholder="Course title or code"
            maxLength={200}
          />
        </label>
        <label>
          Academic term
          <select name="term" defaultValue={term}>
            <option value="">All terms</option>
            {terms.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select name="department" defaultValue={department}>
            <option value="">All departments</option>
            {departments.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button>
          Search
          <Icon name="search" size={16} />
        </button>
      </form>
      <p className="filter-results">
        {results?.length ?? 0} course offering{results?.length === 1 ? "" : "s"}
        {q ? ` matching “${q}”` : ""}
      </p>
      <div className="grid">
        {results?.map((c) => (
          <CourseCard key={c.id} course={c} tenant={tenant} />
        ))}
      </div>
      {!results?.length && (
        <section className="card">
          <Empty>
            No courses match your search. Try another title, term or department.
          </Empty>
        </section>
      )}
    </>
  );
}
