import { type NextRequest, NextResponse } from "next/server";
import { database, configured } from "@/lib/supabase";
import { z } from "zod";
export async function GET(request: NextRequest) {
  const token = z
    .string()
    .min(10)
    .max(512)
    .safeParse(request.nextUrl.searchParams.get("token_hash"));
  const type = z
    .enum(["invite", "recovery"])
    .safeParse(request.nextUrl.searchParams.get("type"));
  const origin =
    process.env.NODE_ENV === "production"
      ? "https://www.syrka.co"
      : request.nextUrl.origin;
  if (configured() && token.success && type.success) {
    const db = await database();
    const { error } = await db.auth.verifyOtp({
      token_hash: token.data,
      type: type.data,
    });
    if (!error)
      return NextResponse.redirect(new URL("/cam/account/password", origin));
  }
  return NextResponse.redirect(
    new URL("/cam/login?notice=invalid-link", origin),
  );
}
