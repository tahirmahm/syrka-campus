"use server";
import { database, configured } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
export async function login(form: FormData) {
  if (!configured()) redirect("/login?notice=setup");
  const values = z
    .object({ email: z.email(), password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!values.success) redirect("/login?notice=invalid");
  const db = await database();
  const { error } = await db.auth.signInWithPassword(values.data);
  if (error) redirect("/login?notice=invalid");
  redirect("/dashboard");
}
export async function logout() {
  const db = await database();
  await db.auth.signOut();
  redirect("/login");
}

export async function demoLogin(form: FormData) {
  const role: Database["public"]["Enums"]["campus_role"] = z
    .enum(["student", "faculty", "admin"])
    .parse(form.get("role"));
  const prefix = `CAMPUS_DEMO_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!configured() || !email || !password)
    redirect("/login?notice=demo-unavailable");
  const db = await database();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/login?notice=demo-unavailable");
  const { data: demoMembership } = await db
    .from("memberships")
    .select("institution_id")
    .eq("user_id", data.user.id)
    .eq("institution_id", process.env.CAMPUS_DEMO_INSTITUTION_ID ?? "")
    .eq("role", role)
    .eq("active", true)
    .maybeSingle();
  if (!demoMembership) {
    await db.auth.signOut();
    redirect("/login?notice=demo-unavailable");
  }
  redirect("/dashboard");
}
