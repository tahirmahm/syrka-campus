import { session } from "@/lib/session";
import { PageTop, TenantPicker, Empty } from "@/components/academic";
export default async function Grades({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, memberships, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const { data, error } = await db
    .from("grades")
    .select(
      "id,points,feedback,published,submissions(assignments(title,max_points))",
    )
    .eq("institution_id", membership.institution_id);
  if (error) throw new Error("Grades unavailable");
  return (
    <>
      <PageTop
        label="04 / YOUR PROGRESS"
        title="Learning, recognised."
        description="Published assessment scores and feedback."
      />
      <TenantPicker
        memberships={memberships}
        current={membership.institution_id}
      />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Assessment</th>
              <th scope="col">Score</th>
              <th scope="col">Feedback</th>
              <th scope="col">Publication</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((g) => {
              const s = g.submissions as unknown as {
                assignments: { title: string; max_points: number };
              };
              return (
                <tr key={g.id}>
                  <td>{s.assignments.title}</td>
                  <td>
                    {g.points} / {s.assignments.max_points}
                  </td>
                  <td>{g.feedback}</td>
                  <td>{g.published ? "Published" : "Draft"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.length && <Empty>No published grades yet.</Empty>}
      </div>
    </>
  );
}
