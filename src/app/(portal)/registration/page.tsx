import { session } from "@/lib/session";
import { register } from "@/lib/actions";
import { PageTop, TenantPicker, Hidden, Empty } from "@/components/academic";
export default async function Registration({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string; notice?: string }>;
}) {
  const { institution, notice } = await searchParams;
  const { db, user, memberships, membership } = await session(institution);
  if (!membership) return <Empty>No institutional membership.</Empty>;
  const tenant = membership.institution_id;
  const [offerings, enrollments, windows] = await Promise.all([
    db
      .from("offerings")
      .select("id,capacity,section,courses(code,title),academic_terms(name)")
      .eq("institution_id", tenant),
    db
      .from("enrollments")
      .select("offering_id,status")
      .eq("institution_id", tenant)
      .eq("user_id", user.id),
    db
      .from("registration_windows")
      .select("id,opens_at,closes_at,academic_terms(name)")
      .eq("institution_id", tenant),
  ]);
  if (offerings.error || enrollments.error || windows.error)
    throw new Error("Registration information unavailable");
  return (
    <>
      <PageTop
        label="03 / YOUR NEXT STEP"
        title="Course registration."
        description="Eligibility, deadlines and capacity are checked when you register."
      />
      <TenantPicker memberships={memberships} current={tenant} />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <section className="card">
        <h3>Registration windows</h3>
        {windows.data?.map((w) => (
          <p key={w.id}>
            {(w.academic_terms as unknown as { name: string }).name}:{" "}
            {new Date(w.opens_at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
            –{" "}
            {new Date(w.closes_at).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
            UTC
          </p>
        ))}
        {!windows.data?.length && <p>Registration has not been scheduled.</p>}
      </section>
      <section className="card">
        {offerings.data?.map((o) => {
          const c = o.courses as unknown as { code: string; title: string };
          const status = enrollments.data?.find(
            (e) => e.offering_id === o.id,
          )?.status;
          return (
            <div className="row" key={o.id}>
              <div>
                <strong>
                  {c.code} · {c.title}
                </strong>
                <p className="small">
                  Section {o.section} / Capacity {o.capacity} /{" "}
                  {status ?? "Not registered"}
                </p>
              </div>
              {membership.role === "student" && status !== "completed" && (
                <form action={register}>
                  <Hidden tenant={tenant} offering={o.id} />
                  {["enrolled", "waitlisted"].includes(status ?? "") ? (
                    <>
                      <input type="hidden" name="withdraw" value="true" />
                      <button className="quiet">Withdraw →</button>
                    </>
                  ) : (
                    <button>Register →</button>
                  )}
                </form>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
