import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/session";
import { z } from "zod";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse("Not found", { status: 404 });
  const tenant = request.nextUrl.searchParams.get("institution");
  if (!tenant || !z.uuid().safeParse(tenant).success)
    return new NextResponse("Not found", { status: 404 });
  const { db, membership } = await session(tenant);
  if (!membership) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await db
    .from("materials")
    .select("object_path")
    .eq("institution_id", tenant)
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.object_path)
    return new NextResponse("Not found", { status: 404 });
  const { data: signed, error: signError } = await db.storage
    .from("campus-materials")
    .createSignedUrl(data.object_path, 60, { download: true });
  if (signError || !signed)
    return new NextResponse("Access denied", { status: 403 });
  return NextResponse.redirect(signed.signedUrl, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
