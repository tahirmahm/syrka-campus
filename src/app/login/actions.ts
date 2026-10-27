"use server";
import { database, configured } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { z } from "zod";
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
