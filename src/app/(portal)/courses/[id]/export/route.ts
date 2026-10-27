import { session } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
function cell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse("Not found", { status: 404 });
  const { db, membership, user } = await session(
    request.nextUrl.searchParams.get("institution") ?? undefined,
  );
  if (!membership) return new NextResponse("Forbidden", { status: 403 });
  const tenant = membership.institution_id;
  const { data: assigned } = await db
    .from("faculty_assignments")
    .select("id")
    .eq("institution_id", tenant)
    .eq("offering_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (
    membership.role !== "admin" &&
    !(membership.role === "faculty" && assigned)
  )
    return new NextResponse("Forbidden", { status: 403 });
  const { data, error } = await db
    .from("course_grades")
    .select("user_id,percentage,feedback,published,updated_at")
    .eq("institution_id", tenant)
    .eq("offering_id", id)
    .order("user_id");
  if (error) return new NextResponse("Export unavailable", { status: 500 });
  const header = [
    "Student UUID",
    "Percentage",
    "Feedback",
    "Published",
    "Updated (UTC)",
  ];
  const csv = [
    header,
    ...(data ?? []).map((g) => [
      g.user_id,
      g.percentage,
      g.feedback,
      g.published,
      g.updated_at,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="course-${id}-grades.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
