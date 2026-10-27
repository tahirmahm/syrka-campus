"use server";
import { database } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { z } from "zod";
export async function setPassword(form: FormData) {
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const password = z.string().min(12).max(128).safeParse(form.get("password"));
  if (!password.success || form.get("confirm") !== password.data)
    redirect("/account/password?notice=invalid");
  const { error } = await db.auth.updateUser({ password: password.data });
  if (error) redirect("/account/password?notice=failed");
  redirect("/dashboard");
}
