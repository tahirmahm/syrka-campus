import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ScheduleClass } from "./schedule-class";
import { Icon } from "./icon";
export async function CourseSessions({
  db,
  offering,
  tenant,
  teaches,
}: {
  db: SupabaseClient;
  offering: string;
  tenant: string;
  teaches: boolean;
}) {
  const { data, error } = await db
    .from("session_rooms")
    .select("id,title,starts_at,status,session_notes(published,updated_at)")
    .eq("institution_id", tenant)
    .eq("offering_id", offering)
    .order("starts_at", { ascending: false })
    .limit(30);
  if (error)
    return (
      <section id="sessions" className="card">
        <h2>Sessions & lecture notes</h2>
        <p>
          {teaches
            ? "Sessions setup is pending. Apply the additive Campus Sessions migration and configure media/AI services."
            : "Online sessions are not enabled for this course yet."}
        </p>
      </section>
    );
  return (
    <section id="sessions" className="card">
      <div className="card-heading">
        <h2>
          <Icon name="video" size={20} />
          Sessions & lecture notes
        </h2>
      </div>
      <p>
        Join an authorized online class. Notes remain private until the
        instructor publishes them.
      </p>
      {teaches && <ScheduleClass tenant={tenant} offering={offering} />}
      <div className="academic-list">
        {data?.map((row) => (
          <article key={row.id}>
            <h3>{row.title}</h3>
            <p>
              {new Date(row.starts_at).toLocaleString()} · {row.status}
            </p>
            <a
              className="button secondary"
              href={`https://www.syrka.co/workspace/tools/sessions/meeting/${row.id}?source=campus`}
            >
              Open session
            </a>
            {(row.session_notes as unknown as { published?: boolean })
              ?.published && (
              <a
                className="button secondary"
                href={`https://www.syrka.co/workspace/tools/sessions/meeting/${row.id}?source=campus&view=notes`}
              >
                Lecture notes
              </a>
            )}
          </article>
        ))}
        {!data?.length && <p>No classes scheduled yet.</p>}
      </div>
      <Link href={`/lecture-notes?institution=${tenant}`}>
        My Lecture Notes
      </Link>
    </section>
  );
}
export async function LectureNotes({
  db,
  tenant,
}: {
  db: SupabaseClient;
  tenant: string;
}) {
  const { data, error } = await db
    .from("session_rooms")
    .select(
      "id,title,starts_at,offering_id,session_notes(body,published,updated_at)",
    )
    .eq("institution_id", tenant)
    .order("starts_at", { ascending: false })
    .limit(100);
  if (error) return null;
  const records =
    data?.filter(
      (row) =>
        (row.session_notes as unknown as { published?: boolean })?.published,
    ) || [];
  return (
    <section className="card">
      <div className="card-heading">
        <h2>
          <Icon name="notes" size={20} />
          My Lecture Notes
        </h2>
      </div>
      <p>
        Instructor-published notes from your authorized courses. AI-generated
        material should be checked against its sources.
      </p>
      {records.length ? (
        records.map((row) => {
          const note = row.session_notes as unknown as {
            body: { overview?: { text: string }[] };
          };
          return (
            <article className="lecture-note-item" key={row.id}>
              <h3>{row.title}</h3>
              <p>{new Date(row.starts_at).toLocaleDateString()}</p>
              <p>{note.body?.overview?.[0]?.text}</p>
              <a
                className="button secondary"
                href={`https://www.syrka.co/workspace/tools/sessions/meeting/${row.id}?source=campus&view=notes`}
              >
                Read notes & transcript
              </a>
              <Link
                href={`/courses/${row.offering_id}?institution=${tenant}#sessions`}
              >
                Course
              </Link>
            </article>
          );
        })
      ) : (
        <p>No published lecture notes yet.</p>
      )}
    </section>
  );
}
