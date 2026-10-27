import { session } from "@/lib/session";
import {
  PageTop,
  TenantPicker,
  CourseCard,
  Empty,
} from "@/components/academic";
export default async function Courses({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string; q?: string; term?: string }>;
}) {
  const { institution, q = "", term = "" } = await searchParams;
  const { db, memberships, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const terms = await db
    .from("academic_terms")
    .select("id,name")
    .eq("institution_id", tenant);
  let query = db
    .from("offerings")
    .select(
      "id,section,capacity,courses!inner(code,title,description,credits),academic_terms(name)",
    )
    .eq("institution_id", tenant);
  if (term) query = query.eq("term_id", term);
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
        label="02 / LEARNING"
        title="Find your direction."
        description="Explore courses across your institution."
      />
      <TenantPicker memberships={memberships} current={tenant} />
      <form className="toolbar">
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
        <button>Search →</button>
      </form>
      <div className="grid">
        {results?.map((c) => (
          <CourseCard key={c.id} course={c} tenant={tenant} />
        ))}
      </div>
      {!results?.length && <Empty>No courses match your search.</Empty>}
    </>
  );
}
