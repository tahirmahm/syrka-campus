import Image from "next/image";
import { database, configured } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { setPassword } from "./actions";
export default async function Password({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!configured()) redirect("/login?notice=setup");
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (process.env.CAMPUS_DEMO_INSTITUTION_ID) {
    const { data: demo } = await db
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("institution_id", process.env.CAMPUS_DEMO_INSTITUTION_ID)
      .maybeSingle();
    if (demo) redirect("/dashboard");
  }
  const { notice } = await searchParams;
  return (
    <main id="main" className="auth">
      <section className="auth-story">
        <Image
          src="/cam/brand/wordmark.jpg"
          alt="Syrka"
          width={520}
          height={170}
          priority
        />
        <h1>A secure start.</h1>
        <p>Set your Campus password to continue.</p>
      </section>
      <section className="auth-form">
        <h2>Your Campus account.</h2>
        <p>{user.email}</p>
        {notice && (
          <p className="notice" role="alert">
            {notice === "invalid"
              ? "Use at least 12 characters and make sure both passwords match."
              : "The password could not be changed. Try a different password or request a new setup link."}
          </p>
        )}
        <form action={setPassword}>
          <label>
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <button>Set password and continue →</button>
        </form>
      </section>
    </main>
  );
}
