import { session } from "@/lib/session";
import { PageTop, TenantPicker, Hidden, Empty } from "@/components/academic";
import { createStructure, membershipChange } from "@/lib/actions";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, memberships, membership } = await session(institution);
  if (!membership) return <Empty>No institution selected.</Empty>;
  if (membership.role !== "admin")
    return <Empty>Institutional administrator access is required.</Empty>;
  const tenant = membership.institution_id;
  const demo = tenant === process.env.CAMPUS_DEMO_INSTITUTION_ID;
  const results = await Promise.all(
    [
      "departments",
      "academic_terms",
      "courses",
      "offerings",
      "memberships",
      "enrollments",
      "audit_logs",
    ].map((t) =>
      db
        .from(t)
        .select("*")
        .eq("institution_id", tenant)
        .order("created_at", { ascending: false })
        .limit(100),
    ),
  );
  if (results.some((r) => r.error))
    throw new Error("Administration records unavailable");
  const [departments, terms, courses, offerings, members, enrollments, audit] =
    results.map((r) => r.data ?? []);
  const selects: Record<string, { id: string; label: string }[]> = {
    department_id: departments.map((d) => ({
      id: d.id,
      label: `${d.code} · ${d.name}`,
    })),
    term_id: terms.map((t) => ({ id: t.id, label: t.name })),
    course_id: courses.map((c) => ({
      id: c.id,
      label: `${c.code} · ${c.title}`,
    })),
    offering_id: offerings.map((o) => ({
      id: o.id,
      label: `${courses.find((c) => c.id === o.course_id)?.code} / ${o.section}`,
    })),
    user_id: members
      .filter((m) => m.role === "faculty" && m.active)
      .map((m) => ({ id: m.user_id, label: m.user_id })),
  };
  const forms: { kind: string; title: string; fields: string[] }[] = [
    { kind: "departments", title: "Department", fields: ["name", "code"] },
    {
      kind: "academic_terms",
      title: "Academic term",
      fields: ["name", "starts_on", "ends_on"],
    },
    {
      kind: "courses",
      title: "Course",
      fields: ["department_id", "code", "title", "description", "credits"],
    },
    {
      kind: "offerings",
      title: "Course offering",
      fields: ["course_id", "term_id", "section", "capacity"],
    },
    {
      kind: "faculty_assignments",
      title: "Faculty assignment",
      fields: ["offering_id", "user_id"],
    },
    {
      kind: "registration_windows",
      title: "Registration window",
      fields: ["term_id", "opens_at", "closes_at", "withdrawal_closes_at"],
    },
  ];
  return (
    <>
      <PageTop
        label="05 / INSTITUTIONAL ADMINISTRATION"
        title="A well-organised institution."
        description="Academic structure, access and oversight."
      />
      <TenantPicker memberships={memberships} current={tenant} />
      <section>
        <h2>Academic configuration</h2>
        {forms.map((f) => (
          <details key={f.kind}>
            <summary>Create {f.title.toLowerCase()}</summary>
            <form action={createStructure}>
              <Hidden tenant={tenant} />
              <input type="hidden" name="kind" value={f.kind} />
              {f.fields.map((key) => (
                <label key={key}>
                  {key.replaceAll("_", " ")}
                  {selects[key] ? (
                    <select name={key} required>
                      <option value="">Select…</option>
                      {selects[key].map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={key}
                      required
                      type={
                        key.endsWith("_on")
                          ? "date"
                          : key.endsWith("_at")
                            ? "datetime-local"
                            : ["capacity", "credits"].includes(key)
                              ? "number"
                              : "text"
                      }
                      min={
                        ["capacity", "credits"].includes(key) ? 1 : undefined
                      }
                      maxLength={10000}
                    />
                  )}
                </label>
              ))}
              {f.kind === "offerings" && (
                <label>
                  <input type="checkbox" name="waitlist_enabled" /> Enable
                  waitlist
                </label>
              )}
              {f.kind === "offerings" && (
                <label>
                  <input type="checkbox" name="published" /> Publish offering
                </label>
              )}
              <button>Create →</button>
            </form>
          </details>
        ))}
      </section>
      <section>
        <h2>Membership access</h2>
        <p>
          Users must first have a Campus authentication account. Only
          administrators can grant institutional roles.
        </p>
        {demo && (
          <p className="notice">
            Demonstration roles are fixed. You can explore academic
            configuration and records without changing shared login access.
          </p>
        )}
        {!demo && (
          <details>
            <summary>Add or update a membership</summary>
            <form action={membershipChange}>
              <Hidden tenant={tenant} />
              <label>
                Authentication user UUID
                <input name="user_id" required />
              </label>
              <label>
                Role
                <select name="role">
                  <option>student</option>
                  <option>faculty</option>
                  <option>admin</option>
                </select>
              </label>
              <label>
                <input type="checkbox" name="active" defaultChecked /> Active
                membership
              </label>
              <button>Save membership →</button>
            </form>
          </details>
        )}
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user_id}</td>
                  <td>{m.role}</td>
                  <td>{m.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Enrollment oversight</h2>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Offering</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td>{e.user_id}</td>
                  <td>{e.offering_id}</td>
                  <td>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Audit trail</h2>
        <div className="card">
          {audit.map((a) => (
            <div className="row" key={a.id}>
              <span>
                {a.operation} / {a.entity}
              </span>
              <span className="small">
                {new Date(a.created_at).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC · {a.actor_id?.slice(0, 8)}
              </span>
            </div>
          ))}
          {!audit.length && <p>No recorded operations yet.</p>}
        </div>
      </section>
    </>
  );
}
