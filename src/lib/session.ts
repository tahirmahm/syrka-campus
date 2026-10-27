import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database, configured } from "./supabase";
export async function session(institution?: string) {
  if (!configured()) redirect("/login?notice=setup");
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: memberships, error } = await db
    .from("memberships")
    .select("institution_id,role,institutions(name)")
    .eq("user_id", user.id)
    .eq("active", true);
  if (error) throw new Error("Unable to verify institutional access.");
  institution ??= (await cookies()).get("campus-institution")?.value;
  const membership =
    memberships?.find((m) => m.institution_id === institution) ??
    (!institution ? memberships?.[0] : undefined);
  return { db, user, memberships: memberships ?? [], membership };
}
