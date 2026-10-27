import { z } from "zod";
import Link from "next/link";
import { session } from "@/lib/session";
import { register } from "@/lib/actions";
import { PageTop, Hidden, Empty } from "@/components/academic";
import { Icon } from "@/components/icon";
import { ConfirmWithdraw } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
export default async function Registration({
  searchParams,
}: {
  searchParams: Promise<{
    institution?: string;
    notice?: string;
    q?: string;
    term?: string;
  }>;
}) {
  const { institution, notice, q: raw = "", term = "" } = await searchParams;
  const q = raw.slice(0, 200);
  const { db, user, membership } = await session(institution);
  if (!membership) return <Empty>No institutional membership.</Empty>;
  const tenant = membership.institution_id;
  let query = db
    .from("offerings")
    .select(
      "id,capacity,section,course_id,waitlist_enabled,courses(code,title,credits),academic_terms(name)",
    )
    .eq("institution_id", tenant);
  if (z.uuid().safeParse(term).success) query = query.eq("term_id", term);
  const [offerings, enrollments, windows, terms, prerequisites, catalog] =
    await Promise.all([
      query,
      db
        .from("enrollments")
        .select("offering_id,status")
        .eq("institution_id", tenant)
        .eq("user_id", user.id),
      db
        .from("registration_windows")
        .select(
          "id,opens_at,closes_at,withdrawal_closes_at,academic_terms(name)",
        )
        .eq("institution_id", tenant),
      db.from("academic_terms").select("id,name").eq("institution_id", tenant),
      db
        .from("prerequisites")
        .select("course_id,prerequisite_id")
        .eq("institution_id", tenant),
      db.from("courses").select("id,code").eq("institution_id", tenant),
    ]);
  if (
    [offerings, enrollments, windows, terms, prerequisites, catalog].some(
      (r) => r.error,
    )
  )
    throw new Error("Registration information unavailable");
  const rows = offerings.data?.filter((o) => {
    const c = o.courses as unknown as { code: string; title: string };
    return `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <>
      <PageTop
        label="Plan your academic term"
        title="Course registration"
        description="Register, review a waitlist place or withdraw. Eligibility, deadlines and capacity are checked securely when you act."
      />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <details className="registration-windows">
        <summary>
          Registration windows{" "}
          <span className="small">
            · View opening, closing and withdrawal dates
          </span>
        </summary>
        {windows.data?.map((w) => (
          <div className="row" key={w.id}>
            <div>
              <h3>{(w.academic_terms as unknown as { name: string }).name}</h3>
              <p className="small">
                Opens{" "}
                {new Date(w.opens_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
                <br />
                Closes{" "}
                {new Date(w.closes_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
                <br />
                Withdraw by{" "}
                {new Date(w.withdrawal_closes_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
            </div>
          </div>
        ))}
        {!windows.data?.length && (
          <Empty>Registration has not been scheduled.</Empty>
        )}
      </details>
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
        <button>
          Search
          <Icon name="search" size={16} />
        </button>
      </form>
      <section className="card">
        {rows?.map((o) => {
          const c = o.courses as unknown as {
            code: string;
            title: string;
            credits: number;
          };
          const status = enrollments.data?.find(
            (e) => e.offering_id === o.id,
          )?.status;
          const required = prerequisites.data
            ?.filter((p) => p.course_id === o.course_id)
            .map(
              (p) =>
                catalog.data?.find((c) => c.id === p.prerequisite_id)?.code,
            )
            .filter(Boolean);
          return (
            <div className="row registration-row" key={o.id}>
              <div>
                <p className="eyebrow">
                  {c.code} · Section {o.section}
                </p>
                <h3>
                  <Link href={`/courses/${o.id}?institution=${tenant}`}>
                    {c.title}
                  </Link>
                </h3>
                <p className="small">
                  {(o.academic_terms as unknown as { name: string }).name} ·{" "}
                  {c.credits} credits · Capacity {o.capacity}
                </p>
                <p>
                  <span
                    className={`status ${status === "enrolled" || status === "completed" ? "status-published" : status === "waitlisted" ? "status-draft" : ""}`}
                  >
                    {status === "enrolled"
                      ? "Enrolled"
                      : status === "waitlisted"
                        ? "Waitlisted"
                        : status === "withdrawn"
                          ? "Withdrawn"
                          : status === "completed"
                            ? "Completed"
                            : "Not registered"}
                  </span>
                  {o.waitlist_enabled && (
                    <span className="small"> · Waitlist available</span>
                  )}
                </p>
                {!!required?.length && (
                  <p className="small">Prerequisites: {required.join(", ")}</p>
                )}
              </div>
              {membership.role === "student" && status !== "completed" && (
                <form action={register} className="registration-action">
                  <Hidden tenant={tenant} offering={o.id} />
                  {["enrolled", "waitlisted"].includes(status ?? "") ? (
                    <>
                      <input type="hidden" name="withdraw" value="true" />
                      <ConfirmWithdraw course={c.title} />
                    </>
                  ) : (
                    <SubmitButton pendingLabel="Registering…">
                      Register
                      <Icon name="arrow" size={16} />
                    </SubmitButton>
                  )}
                </form>
              )}
            </div>
          );
        })}
        {!rows?.length && (
          <Empty>No course offerings match your filters.</Empty>
        )}
      </section>
    </>
  );
}
