"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ScheduleClass({
  tenant,
  offering,
}: {
  tenant: string;
  offering: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <details className="staff-details">
      <summary>Schedule an online class</summary>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            const response = await fetch("/cam/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create",
                data: {
                  title: f.get("title"),
                  description: f.get("description"),
                  starts_at: new Date(String(f.get("starts_at"))).toISOString(),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  kind: "lecture",
                  institution_id: tenant,
                  offering_id: offering,
                },
              }),
            });
            const result = await response.json();
            if (!response.ok)
              throw Error(result.error || "Class could not be scheduled.");
            router.refresh();
            setError("Class scheduled. Use its secure session link below.");
          } catch (err) {
            setError(String(err instanceof Error ? err.message : err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Class title
          <input name="title" required maxLength={160} />
        </label>
        <label>
          Date and time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          <input name="starts_at" type="datetime-local" required />
        </label>
        <label>
          Description
          <textarea name="description" maxLength={4000} />
        </label>
        <button disabled={busy}>
          {busy ? "Scheduling…" : "Schedule class"}
        </button>
        {error && <p role="status">{error}</p>}
      </form>
    </details>
  );
}
