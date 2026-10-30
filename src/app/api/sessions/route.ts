import { after } from "next/server";
import { database, configured } from "@/lib/supabase";
import { sessionsHandler } from "@/lib/sessions/server";
export const runtime = "nodejs";
export const maxDuration = 300;
async function handler(request: Request) {
  if (!configured())
    return Response.json(
      { error: "Campus backend is not configured." },
      { status: 503 },
    );
  const db = await database();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    return Response.json(
      { error: "Sign in to Campus to access your classes." },
      { status: 401 },
    );
  return sessionsHandler(request, { db, user, source: "campus" }, (task) =>
    after(task),
  );
}
export { handler as GET, handler as POST };
