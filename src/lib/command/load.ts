import "server-only";
import { currentCourses } from "@/lib/academic-read";
import type { session } from "@/lib/session";
import { timestamp, type Activity, type CommandData } from "./model";

type Attempt = { id: string; expires_at: string; finished_at: string | null };

/** Student suggestions use the normal session, existing RLS and published source records. */
export async function loadCommand(
  context: Awaited<ReturnType<typeof session>>,
): Promise<CommandData> {
  const { db, user, membership } = context;
  if (!membership || membership.role !== "student")
    throw new Error("Active student membership required");
  const tenant = membership.institution_id;
  const now = new Date().toISOString();
  const [courses, enrollments] = await Promise.all([
    currentCourses(context),
    db
      .from("enrollments")
      .select("offering_id,status")
      .eq("institution_id", tenant)
      .eq("user_id", user.id)
      .in("status", ["enrolled", "completed"]),
  ]);
  if (enrollments.error)
    throw new Error("Course access is temporarily unavailable");
  const mapped = courses.map((c) => {
    const course = c.courses as unknown as {
      code: string;
      title: string;
      credits: number;
    } | null;
    const term = c.academic_terms as unknown as { name: string } | null;
    if (!course || !term)
      throw new Error("Course information is temporarily unavailable");
    return {
      id: c.id,
      ...course,
      term: term.name,
      href: `/courses/${c.id}?institution=${tenant}`,
      completed:
        enrollments.data?.some(
          (e) => e.offering_id === c.id && e.status === "completed",
        ) ?? false,
    };
  });
  const allCourseIds = mapped.map((c) => c.id);
  const activeCourseIds = mapped.filter((c) => !c.completed).map((c) => c.id);
  const [
    assignments,
    submissions,
    assessments,
    events,
    updates,
    feedback,
    materials,
  ] = await Promise.all([
    db
      .from("assignments")
      .select("id,title,due_at,offering_id")
      .eq("institution_id", tenant)
      .in("offering_id", activeCourseIds)
      .eq("published", true)
      .order("due_at")
      .limit(200),
    db
      .from("submissions")
      .select("assignment_id,status")
      .eq("institution_id", tenant)
      .eq("user_id", user.id)
      .limit(1000),
    db
      .from("assessments")
      .select("id,title,offering_id,opens_at,closes_at,attempt_limit")
      .eq("institution_id", tenant)
      .in("offering_id", activeCourseIds)
      .eq("published", true)
      .gt("closes_at", now)
      .order("closes_at")
      .limit(100),
    db
      .from("calendar_events")
      .select("id,title,starts_at,ends_at,offering_id")
      .eq("institution_id", tenant)
      .gt("ends_at", now)
      .order("starts_at")
      .limit(100),
    db
      .from("announcements")
      .select("id,title,body,offering_id")
      .eq("institution_id", tenant)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("grades")
      .select(
        "id,updated_at,submissions!inner(user_id,assignment_id,assignments(title,offering_id))",
      )
      .eq("institution_id", tenant)
      .eq("published", true)
      .eq("submissions.user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30),
    db
      .from("materials")
      .select("id,title,offering_id")
      .eq("institution_id", tenant)
      .in("offering_id", activeCourseIds)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);
  if (
    [
      assignments,
      submissions,
      assessments,
      events,
      updates,
      feedback,
      materials,
    ].some((r) => r.error)
  )
    throw new Error("Academic priorities are temporarily unavailable");

  // Student attempts deliberately deny direct table reads. This existing RPC returns
  // only this user's attempt metadata, never questions, marking keys or unpublished marks.
  const attempts = new Map<string, Attempt[]>();
  const assessmentRows = assessments.data ?? [];
  for (let offset = 0; offset < assessmentRows.length; offset += 10) {
    const batch = await Promise.all(
      assessmentRows.slice(offset, offset + 10).map(async (a) => {
        const result = await db.rpc("my_attempts", {
          tenant,
          assessment: a.id,
        });
        if (result.error)
          throw new Error("Assessment status is temporarily unavailable");
        return [a.id, (result.data ?? []) as Attempt[]] as const;
      }),
    );
    for (const [id, rows] of batch) attempts.set(id, rows);
  }
  const code = (id?: string | null) =>
    mapped.find((c) => c.id === id)?.code ?? "Institution";
  const submissionStates = new Map(
    (submissions.data ?? []).map((s) => [s.assignment_id, s.status]),
  );
  const activities: Activity[] = [
    ...(assignments.data ?? []).map((a) => ({
      id: `assignment:${a.id}`,
      courseId: a.offering_id,
      course: code(a.offering_id),
      title: a.title,
      kind: "assignment" as const,
      href: `/courses/${a.offering_id}?institution=${tenant}#assignment-${a.id}`,
      at: a.due_at,
      state:
        submissionStates.get(a.id) === "submitted"
          ? ("submitted" as const)
          : submissionStates.get(a.id) === "draft"
            ? ("draft" as const)
            : ("not-started" as const),
    })),
    ...assessmentRows.map((a) => {
      const rows = attempts.get(a.id) ?? [];
      const active = rows.some(
        (t) =>
          !t.finished_at && (timestamp(t.expires_at) ?? 0) > Date.parse(now),
      );
      const complete = rows.some((t) => t.finished_at !== null);
      return {
        id: `assessment:${a.id}`,
        courseId: a.offering_id,
        course: code(a.offering_id),
        title: a.title,
        kind: "assessment" as const,
        href: `/assessments/${a.id}?institution=${tenant}`,
        at: a.closes_at,
        availableAt: a.opens_at,
        state: active
          ? ("draft" as const)
          : complete
            ? ("completed" as const)
            : ("not-started" as const),
        blocked: !active && !complete && rows.length >= a.attempt_limit,
      };
    }),
    ...(events.data ?? [])
      .filter((e) => !e.offering_id || activeCourseIds.includes(e.offering_id))
      .map((e) => ({
        id: `event:${e.id}`,
        courseId: e.offering_id ?? undefined,
        course: code(e.offering_id),
        title: e.title,
        // The calendar schema has no type, meeting admission or Sessions URL. Do not infer a class.
        kind: "event" as const,
        href: `/calendar?institution=${tenant}`,
        at: e.starts_at,
        endsAt: e.ends_at,
        state: "not-started" as const,
      })),
    ...(materials.data ?? []).map((m) => ({
      id: `reading:${m.id}`,
      courseId: m.offering_id,
      course: code(m.offering_id),
      title: m.title,
      kind: "reading" as const,
      href: `/courses/${m.offering_id}?institution=${tenant}#readings`,
      state: "published" as const,
    })),
  ];
  for (const f of feedback.data ?? []) {
    const submission = f.submissions as unknown as {
      user_id: string;
      assignments: { title: string; offering_id: string } | null;
    } | null;
    if (
      submission?.user_id !== user.id ||
      !submission.assignments ||
      !allCourseIds.includes(submission.assignments.offering_id)
    )
      continue;
    activities.push({
      // Publication revisions resurface after a previous version was dismissed.
      id: `feedback:${f.id}:${f.updated_at}`,
      courseId: submission.assignments.offering_id,
      course: code(submission.assignments.offering_id),
      title: submission.assignments.title,
      kind: "feedback",
      href: `/grades?institution=${tenant}`,
      state: "published",
    });
  }
  return {
    scope: `${user.id}:${tenant}`,
    institution: (membership.institutions as unknown as { name: string }).name,
    now,
    courses: mapped,
    activities,
    limited:
      (submissions.data?.length ?? 0) >= 1000 ||
      courses.length >= 200 ||
      (assignments.data?.length ?? 0) >= 200 ||
      assessmentRows.length >= 100 ||
      (events.data?.length ?? 0) >= 100 ||
      (materials.data?.length ?? 0) >= 100 ||
      (feedback.data?.length ?? 0) >= 30,
    updates: (updates.data ?? [])
      .filter((u) => !u.offering_id || allCourseIds.includes(u.offering_id))
      .map((u) => ({
        ...u,
        course: code(u.offering_id),
        href: u.offering_id
          ? `/courses/${u.offering_id}?institution=${tenant}#announcements`
          : undefined,
      })),
  };
}
