"use server";
import { z } from "zod";
import { session } from "./session";
import { revalidatePath } from "next/cache";
const uuid = z.uuid();
export async function saveRecord(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    offering = uuid.parse(form.get("offering"));
  const { db } = await session(tenant);
  const kind = z
    .enum([
      "attendance",
      "calendar_events",
      "grade_categories",
      "grade_items",
      "course_grades",
    ])
    .parse(form.get("kind"));
  let error;
  if (kind === "course_grades") {
    ({ error } = await db.rpc("calculate_course_grade", {
      tenant,
      offering,
      student: uuid.parse(form.get("user_id")),
      comments: z.string().max(10000).parse(form.get("feedback")),
      publish: form.get("publish") === "on",
    }));
  } else {
    const row: Record<string, unknown> = { institution_id: tenant };
    if (kind !== "grade_items") row.offering_id = offering;
    if (kind === "attendance")
      Object.assign(row, {
        user_id: uuid.parse(form.get("user_id")),
        session_date: z.iso.date().parse(form.get("date")),
        status: z
          .enum(["present", "absent", "excused", "late"])
          .parse(form.get("status")),
      });
    if (kind === "calendar_events")
      Object.assign(row, {
        title: z.string().trim().min(1).max(300).parse(form.get("title")),
        starts_at: new Date(
          z.string().parse(form.get("starts_at")) + "Z",
        ).toISOString(),
        ends_at: new Date(
          z.string().parse(form.get("ends_at")) + "Z",
        ).toISOString(),
      });
    if (kind === "grade_categories")
      Object.assign(row, {
        name: z.string().trim().min(1).max(200).parse(form.get("title")),
        weight:
          z.coerce.number().min(0).max(100).parse(form.get("weight")) / 100,
      });
    if (kind === "grade_items") {
      const source = z
        .enum(["assignment", "assessment"])
        .parse(form.get("source"));
      Object.assign(row, {
        category_id: uuid.parse(form.get("category")),
        title: z.string().trim().min(1).max(300).parse(form.get("title")),
        [source === "assignment" ? "assignment_id" : "assessment_id"]:
          uuid.parse(form.get(source)),
      });
    }
    if (kind === "attendance")
      ({ error } = await db
        .from(kind)
        .upsert(row, {
          onConflict: "institution_id,offering_id,user_id,session_date",
        }));
    else ({ error } = await db.from(kind).insert(row));
  }
  if (error) throw new Error(error.message);
  revalidatePath(`/cam/courses/${offering}/records`);
  revalidatePath("/cam/grades");
}
