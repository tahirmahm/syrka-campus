import Link from "next/link";
import { z } from "zod";
import { session } from "@/lib/session";
import { PageTop, Empty, DateChip } from "@/components/academic";
import { Icon, type IconName } from "@/components/icon";
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string; from?: string }>;
}) {
  const { institution, from } = await searchParams;
  const { db, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  const tenant = membership.institution_id;
  const start = z.iso.date().safeParse(from);
  const date = start.success
    ? start.data
    : new Date().toISOString().slice(0, 10);
  const [events, assignments, assessments] = await Promise.all([
    db
      .from("calendar_events")
      .select("id,title,starts_at,ends_at,offering_id")
      .eq("institution_id", tenant)
      .gte("ends_at", date)
      .order("starts_at")
      .limit(200),
    db
      .from("assignments")
      .select("id,title,due_at,offering_id")
      .eq("institution_id", tenant)
      .eq("published", true)
      .gte("due_at", date)
      .order("due_at")
      .limit(200),
    db
      .from("assessments")
      .select("id,title,opens_at,closes_at")
      .eq("institution_id", tenant)
      .eq("published", true)
      .gte("closes_at", date)
      .order("closes_at")
      .limit(200),
  ]);
  if ([events, assignments, assessments].some((r) => r.error))
    throw new Error("Calendar unavailable");
  const entries: {
    id: string;
    title: string;
    at: string;
    kind: string;
    icon: IconName;
    href?: string;
  }[] = [
    ...(events.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      at: e.starts_at,
      kind: e.offering_id ? "Course event" : "Institution event",
      icon: "calendar" as const,
      href: e.offering_id
        ? `/courses/${e.offering_id}/records?institution=${tenant}`
        : undefined,
    })),
    ...(assignments.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      at: a.due_at,
      kind: "Assignment deadline",
      icon: "assignment" as const,
      href: `/courses/${a.offering_id}?institution=${tenant}#assignment-${a.id}`,
    })),
    ...(assessments.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      at: a.closes_at,
      kind: "Assessment closes",
      icon: "assessment" as const,
      href: `/assessments/${a.id}?institution=${tenant}`,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <>
      <PageTop
        label="Your academic schedule"
        title="Calendar"
        description="Course events, assignment deadlines and assessment dates. All times are shown in UTC."
      />
      <form className="toolbar filter-bar">
        <input type="hidden" name="institution" value={tenant} />
        <label>
          Show dates from
          <input type="date" name="from" defaultValue={date} />
        </label>
        <button>
          Apply dates
          <Icon name="arrow" size={16} />
        </button>
      </form>
      <section className="card">
        {entries.map((e) => (
          <div className="list-item" key={`${e.kind}-${e.id}`}>
            <DateChip value={e.at} />
            <div>
              {e.href ? (
                <Link href={e.href}>{e.title}</Link>
              ) : (
                <strong>{e.title}</strong>
              )}
              <p>
                <Icon name={e.icon} size={12} /> {e.kind} ·{" "}
                {new Date(e.at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
                UTC
              </p>
            </div>
          </div>
        ))}
        {!entries.length && (
          <Empty>No academic dates are scheduled in this period.</Empty>
        )}
      </section>
    </>
  );
}
