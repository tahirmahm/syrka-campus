import { session } from "@/lib/session";
import { PageTop } from "@/components/academic";
import { LectureNotes } from "@/components/course-sessions";
export default async function Notes({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const { db, membership } = await session(institution);
  return (
    <>
      <PageTop
        label="Sessions & Notes"
        title="My Lecture Notes"
        description="Published, source-linked knowledge from your authorized courses."
      />
      {membership && (
        <LectureNotes db={db} tenant={membership.institution_id} />
      )}
    </>
  );
}
