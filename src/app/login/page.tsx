import Image from "next/image";
import { login, demoLogin } from "./actions";
import { configured } from "@/lib/supabase";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <main id="main" className="auth">
      <section className="auth-story">
        <Image
          src="/cam/brand/wordmark.jpg"
          width={520}
          height={170}
          alt="Syrka"
          priority
        />
        <p className="eyebrow">CAMPUS / A PLACE TO LEARN</p>
        <h1>
          Knowledge opens
          <br />
          new directions.
        </h1>
        <p>
          Your courses, your community, your next chapter.
          <br />
          One considered space for academic life.
        </p>
        <div className="wayfinding">
          01 &nbsp; Learn &nbsp; ↗<br />
          02 &nbsp; Connect &nbsp; ↗<br />
          03 &nbsp; Grow &nbsp; ↗
        </div>
      </section>
      <section className="auth-form">
        <p className="eyebrow">WELCOME TO SYRKA CAMPUS</p>
        <h2>Continue your journey.</h2>
        <p>Sign in with your Campus account.</p>
        {(!configured() || notice === "setup") && (
          <p role="status" className="notice">
            Campus is awaiting its dedicated backend. Sign-in will be available
            once setup is complete.
          </p>
        )}
        {notice === "invalid-link" && (
          <p role="alert" className="notice">
            This account setup link has expired or has already been used. Ask
            your administrator for a new link.
          </p>
        )}
        {notice === "invalid" && (
          <p role="alert" className="notice">
            Unable to sign in. Check your email and password.
          </p>
        )}
        <form action={login}>
          <label>
            Email address
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={!configured()}>
            Sign in <span>→</span>
          </button>
        </form>
        {configured() && process.env.CAMPUS_DEMO_INSTITUTION_ID && (
          <section className="demo-access" aria-label="Demo access">
            <h3>Take a look around.</h3>
            <p className="small">
              Explore a demonstration institution with sample records. No email
              verification needed.
            </p>
            <form action={demoLogin}>
              <div className="toolbar">
                {(["student", "faculty", "admin"] as const).map((role) => (
                  <button key={role} name="role" value={role} className="quiet">
                    Explore as {role === "admin" ? "administrator" : role} →
                  </button>
                ))}
              </div>
            </form>
          </section>
        )}
        {notice === "demo-unavailable" && (
          <p className="notice" role="alert">
            Demo access is temporarily unavailable. Please try again later.
          </p>
        )}
        <p className="small">
          Accounts and institutional access are managed by your institution.
          Contact your academic administrator for assistance.
        </p>
        <footer>
          SYRKA CAMPUS <span>Learning, thoughtfully connected.</span>
        </footer>
      </section>
    </main>
  );
}
