"use server";
import { z } from "zod";
import { session } from "./session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
const id = z.uuid();
async function context(form: FormData) {
  const tenant = id.parse(form.get("tenant"));
  return { tenant, ...(await session(tenant)) };
}
function date(form: FormData, key: string) {
  return z.iso
    .datetime()
    .parse(new Date(z.string().parse(form.get(key)) + "Z").toISOString());
}
export async function createAssessment(form: FormData) {
  const { db, tenant } = await context(form);
  const offering = id.parse(form.get("offering"));
  const { error } = await db
    .from("assessments")
    .insert({
      institution_id: tenant,
      offering_id: offering,
      title: z.string().trim().min(1).max(300).parse(form.get("title")),
      kind: z.enum(["quiz", "exam"]).parse(form.get("kind")),
      opens_at: date(form, "opens_at"),
      closes_at: date(form, "closes_at"),
      time_limit_minutes: z.coerce
        .number()
        .int()
        .min(1)
        .max(1440)
        .parse(form.get("minutes")),
      attempt_limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(20)
        .parse(form.get("attempts")),
      randomized: form.get("randomized") === "on",
    });
  if (error) throw new Error(error.message);
  revalidatePath(`/cam/courses/${offering}`);
}
export async function addQuestion(form: FormData) {
  const { db, tenant } = await context(form);
  const assessment = id.parse(form.get("assessment"));
  const kind = z
    .enum(["single", "multiple", "boolean", "short", "essay"])
    .parse(form.get("kind"));
  const bodies = z
    .string()
    .max(30000)
    .parse(form.get("options") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const correct = z
    .string()
    .max(100)
    .parse(form.get("correct") ?? "")
    .split(",")
    .map((s) => Number(s.trim()));
  const content = {
    kind,
    prompt: z.string().trim().min(1).max(10000).parse(form.get("prompt")),
    points: z.coerce.number().positive().max(10000).parse(form.get("points")),
    expected: z
      .string()
      .max(2000)
      .parse(form.get("expected") ?? ""),
    options: bodies.map((body, i) => ({
      body,
      correct: correct.includes(i + 1),
    })),
  };
  const { error } = await db.rpc("author_question", {
    tenant,
    assessment,
    content,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/cam/assessments/${assessment}`);
}
export async function publishAssessment(form: FormData) {
  const { db, tenant } = await context(form);
  const assessment = id.parse(form.get("assessment"));
  const { error } = await db
    .from("assessments")
    .update({
      published: form.get("published") === "on",
      results_published: form.get("results_published") === "on",
    })
    .eq("institution_id", tenant)
    .eq("id", assessment)
    .select("id")
    .single();
  if (error) throw new Error("Assessment publication failed");
  revalidatePath(`/cam/assessments/${assessment}`);
}
export async function startAssessment(form: FormData) {
  const { db, tenant } = await context(form);
  const assessment = id.parse(form.get("assessment"));
  const { data, error } = await db.rpc("start_assessment", {
    tenant,
    assessment,
  });
  if (error)
    redirect(
      `/assessments/${assessment}?institution=${tenant}&notice=${encodeURIComponent(error.message)}`,
    );
  redirect(`/attempts/${data}?institution=${tenant}`);
}
export async function saveAttempt(form: FormData) {
  const { db, tenant } = await context(form);
  const attempt = id.parse(form.get("attempt"));
  // Question types are supplied only to serialize HTML fields. The database
  // validates every question and option against the immutable attempt snapshot.
  const questions = z
    .record(id, z.enum(["single", "multiple", "boolean", "short", "essay"]))
    .parse(JSON.parse(z.string().max(100000).parse(form.get("questions"))));
  const answers = Object.fromEntries(
    Object.entries(questions).map(([key, kind]) => [
      key,
      ["single", "multiple", "boolean"].includes(kind)
        ? form.getAll(`answer-${key}`)
        : (form.get(`answer-${key}`) ?? ""),
    ]),
  );
  const { error } = await db.rpc("save_attempt", {
    tenant,
    attempt,
    answers,
    finalize: form.get("finalize") === "true",
  });
  const notice = error ? error.message : "Responses saved";
  revalidatePath(`/cam/attempts/${attempt}`);
  redirect(
    `/attempts/${attempt}?institution=${tenant}&notice=${encodeURIComponent(notice)}`,
  );
}
export async function markResponse(form: FormData) {
  const { db, tenant } = await context(form);
  const attempt = id.parse(form.get("attempt"));
  const { error } = await db.rpc("mark_response", {
    tenant,
    attempt,
    question: id.parse(form.get("question")),
    score: z.coerce.number().min(0).max(10000).parse(form.get("points")),
    comments: z.string().max(10000).parse(form.get("feedback")),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/cam/attempts/${attempt}`);
}
