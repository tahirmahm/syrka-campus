import { SubmitButton } from "@/components/submit-button";
import { publishDelivery } from "@/lib/actions";
import { Hidden } from "./academic";
export function Publication({
  tenant,
  offering,
  kind,
  id,
  published,
}: {
  tenant: string;
  offering: string;
  kind: "modules" | "materials" | "assignments" | "announcements";
  id: string;
  published: boolean;
}) {
  return (
    <form action={publishDelivery}>
      <Hidden tenant={tenant} offering={offering} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="record" value={id} />
      <input type="hidden" name="published" value={String(!published)} />
      <SubmitButton className="quiet">
        {published ? "Unpublish" : "Publish"}{" "}
      </SubmitButton>
    </form>
  );
}
