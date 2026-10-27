import "server-only";
import type { session } from "./session";
type Context = Awaited<ReturnType<typeof session>>;
/** Reuse the existing user session and RLS; a tenant parameter alone is never authorization. */
export async function currentCourses(
  { db, user, membership }: Context,
  limit = 200,
) {
  if (!membership) return [];
  const tenant = membership.institution_id;
  let query = db
    .from("offerings")
    .select(
      "id,section,capacity,courses(code,title,description,credits),academic_terms(name)",
    )
    .eq("institution_id", tenant);
  if (membership.role !== "admin") {
    const scope =
      membership.role === "student"
        ? db
            .from("enrollments")
            .select("offering_id")
            .eq("institution_id", tenant)
            .eq("user_id", user.id)
            .in("status", ["enrolled", "completed"])
        : db
            .from("faculty_assignments")
            .select("offering_id")
            .eq("institution_id", tenant)
            .eq("user_id", user.id);
    const { data, error } = await scope;
    if (error) throw new Error("Course access unavailable");
    query = query.in("id", data?.map((r) => r.offering_id) ?? []);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Courses unavailable");
  return data ?? [];
}
