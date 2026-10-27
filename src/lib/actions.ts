"use server";
import { z } from "zod";
import { session } from "./session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
const uuid = z.uuid();
function text(form: FormData, key: string, max = 10000) {
  return z.string().min(1).max(max).parse(form.get(key));
}
export async function register(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    offering = uuid.parse(form.get("offering"));
  const { db, membership } = await session(tenant);
  if (membership?.role !== "student")
    throw new Error("Student membership required");
  const { error } = await db.rpc("register_course", {
    tenant,
    offering,
    withdraw: form.get("withdraw") === "true",
  });
  if (error)
    redirect(
      `/campus/registration?institution=${tenant}&notice=${encodeURIComponent(error.message)}`,
    );
  revalidatePath("/campus/registration");
  redirect(
    `/campus/registration?institution=${tenant}&notice=Registration+updated`,
  );
}
export async function submit(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    assignment = uuid.parse(form.get("assignment")),
    offering = uuid.parse(form.get("offering"));
  const { db } = await session(tenant);
  const { error } = await db.rpc("submit_assignment", {
    tenant,
    assignment,
    body_text: z.string().max(100000).parse(form.get("body")),
    finalize: form.get("finalize") === "true",
  });
  if (error)
    redirect(
      `/campus/courses/${offering}?institution=${tenant}&notice=${encodeURIComponent(error.message)}`,
    );
  revalidatePath(`/campus/courses/${offering}`);
  redirect(
    `/campus/courses/${offering}?institution=${tenant}&notice=Work+saved`,
  );
}
export async function grade(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    submission = uuid.parse(form.get("submission")),
    offering = uuid.parse(form.get("offering"));
  const { db } = await session(tenant);
  const { error } = await db.rpc("grade_submission", {
    tenant,
    submission,
    score: z.coerce.number().min(0).parse(form.get("score")),
    comments: z.string().max(10000).parse(form.get("feedback")),
    publish: form.get("publish") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/campus/courses/${offering}`);
}
export async function createDelivery(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    offering = uuid.parse(form.get("offering"));
  const { db, membership, user } = await session(tenant);
  if (!membership) throw new Error("Institution access required");
  if (membership.role !== "admin") {
    const { data } = await db
      .from("faculty_assignments")
      .select("id")
      .eq("institution_id", tenant)
      .eq("offering_id", offering)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data || membership.role !== "faculty")
      throw new Error("Faculty assignment required");
  }
  const kind = z
    .enum(["modules", "assignments", "announcements", "materials"])
    .parse(form.get("kind"));
  const base = {
    institution_id: tenant,
    offering_id: offering,
    title: text(form, "title", 300),
    published: form.get("published") === "on",
  };
  const values: Record<string, unknown> =
    kind === "modules"
      ? { ...base, description: text(form, "description") }
      : kind === "assignments"
        ? {
            ...base,
            instructions: text(form, "instructions"),
            due_at: z.iso
              .datetime({ offset: true })
              .parse(new Date(text(form, "due_at") + "Z").toISOString()),
            max_points: z.coerce
              .number()
              .positive()
              .max(10000)
              .parse(form.get("max_points")),
          }
        : kind === "materials"
          ? {
              ...base,
              external_url: z
                .url({ protocol: /^https$/ })
                .parse(form.get("external_url")),
            }
          : { ...base, body: text(form, "body") };
  const { error } = await db.from(kind).insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(`/campus/courses/${offering}`);
}
export async function createStructure(form: FormData) {
  const tenant = uuid.parse(form.get("tenant"));
  const { db, membership } = await session(tenant);
  if (membership?.role !== "admin") throw new Error("Administrator required");
  const kind = z
    .enum([
      "departments",
      "academic_terms",
      "courses",
      "offerings",
      "faculty_assignments",
      "registration_windows",
    ])
    .parse(form.get("kind"));
  const row: Record<string, unknown> = { institution_id: tenant };
  const columns: Record<typeof kind, string[]> = {
    departments: ["name", "code"],
    academic_terms: ["name", "starts_on", "ends_on"],
    courses: ["department_id", "code", "title", "description", "credits"],
    offerings: ["course_id", "term_id", "section", "capacity"],
    faculty_assignments: ["offering_id", "user_id"],
    registration_windows: [
      "term_id",
      "opens_at",
      "closes_at",
      "withdrawal_closes_at",
    ],
  };
  for (const key of columns[kind]) {
    const value = text(form, key);
    row[key] = key.endsWith("_id")
      ? uuid.parse(value)
      : ["capacity", "credits"].includes(key)
        ? z.coerce.number().positive().parse(value)
        : key.endsWith("_at")
          ? new Date(value + "Z").toISOString()
          : value;
  }
  if (kind === "offerings") row.published = form.get("published") === "on";
  const { error } = await db.from(kind).insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/campus/admin");
}
export async function membershipChange(form: FormData) {
  const tenant = uuid.parse(form.get("tenant"));
  const { db, membership } = await session(tenant);
  if (membership?.role !== "admin") throw new Error("Administrator required");
  const { error } = await db.rpc("set_membership", {
    tenant,
    member: uuid.parse(form.get("user_id")),
    new_role: z.enum(["student", "faculty", "admin"]).parse(form.get("role")),
    enabled: form.get("active") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/campus/admin");
}
export async function uploadMaterial(form: FormData) {
  const tenant = uuid.parse(form.get("tenant")),
    offering = uuid.parse(form.get("offering"));
  const { db, membership, user } = await session(tenant);
  if (!membership) throw new Error("Institution required");
  if (membership.role !== "admin") {
    const { data } = await db
      .from("faculty_assignments")
      .select("id")
      .eq("institution_id", tenant)
      .eq("offering_id", offering)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data || membership.role !== "faculty")
      throw new Error("Assigned faculty required");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 10485760)
    throw new Error("Choose a file up to 10 MB");
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("Allowed files: PDF, TXT, DOCX, PPTX");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    extension === "pdf" &&
    new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-"
  )
    throw new Error("Invalid PDF");
  if (
    ["docx", "pptx"].includes(extension) &&
    (bytes[0] !== 80 || bytes[1] !== 75)
  )
    throw new Error("Invalid Office document");
  const path = `${tenant}/${offering}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await db.storage
    .from("campus-materials")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("File upload failed");
  const { error } = await db.from("materials").insert({
    institution_id: tenant,
    offering_id: offering,
    title: text(form, "title", 300),
    object_path: path,
    published: form.get("published") === "on",
  });
  if (error)
    throw new Error(
      "File uploaded but resource could not be linked. Contact your administrator.",
    );
  revalidatePath(`/campus/courses/${offering}`);
}

export async function switchInstitution(form: FormData) {
  const tenant = uuid.parse(form.get("institution"));
  const { membership } = await session(tenant);
  if (!membership) throw new Error("Institution access required");
  const { cookies } = await import("next/headers");
  (await cookies()).set("campus-institution", tenant, {
    path: "/campus",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect(`/dashboard?institution=${tenant}`);
}
