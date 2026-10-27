import { SubmitButton } from "@/components/submit-button";
import { login, demoLogin } from "./actions";
import { configured } from "@/lib/supabase";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const ready = configured();
  return (
    <main id="main" className="auth">
      <div className="auth-layout">
        <section className="auth-story" aria-label="About Syrka Campus">
          <Brand wordmark />
          <h2>
            Your academic world,
            <br />
            clearly connected.
          </h2>
          <p>
            A considered space for learning, teaching and everything that
            connects them.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <Icon name="book" size={21} />
              <div>
                <strong>A clear learning path</strong>
                <p>
                  Courses, weekly readings and materials in one familiar place.
                </p>
              </div>
            </div>
            <div className="auth-feature">
              <Icon name="calendar" size={21} />
              <div>
                <strong>Know what comes next</strong>
                <p>Keep assignments, assessments and academic dates in view.</p>
              </div>
            </div>
            <div className="auth-feature">
              <Icon name="users" size={21} />
              <div>
                <strong>Your institution, connected</strong>
                <p>
                  A shared academic environment with the right access for every
                  role.
                </p>
              </div>
            </div>
          </div>
          <p className="auth-caption">
            SYRKA / CAMPUS
            <br />A little clarity. More room to learn.
          </p>
        </section>
        <section className="auth-form">
          <div className="auth-mobile-brand">
            <Brand wordmark />
          </div>
          <p className="eyebrow">Your academic workspace</p>
          <h1>Sign in to Campus</h1>
          <p>Continue with your institutional Campus account.</p>
          {(!ready || notice === "setup") && (
            <p role="status" className="notice">
              Campus is awaiting its dedicated backend. Sign-in will be
              available once setup is complete.
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
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@institution.edu"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>
            <SubmitButton disabled={!ready} pendingLabel="Signing in…">
              Sign in
              <Icon name="arrow" size={17} />
            </SubmitButton>
          </form>
          {ready && process.env.CAMPUS_DEMO_INSTITUTION_ID && (
            <section className="demo-access" aria-label="Demo access">
              <h2>Explore the demo</h2>
              <p>Try a sample institution. No email verification needed.</p>
              <form action={demoLogin} className="demo-actions">
                {(["student", "faculty", "admin"] as const).map((role) => (
                  <SubmitButton
                    pendingLabel="Opening…"
                    key={role}
                    name="role"
                    value={role}
                    aria-label={`Explore as ${role === "admin" ? "administrator" : role}`}
                  >
                    <Icon
                      name={
                        role === "student"
                          ? "graduation"
                          : role === "faculty"
                            ? "book"
                            : "institution"
                      }
                    />
                    <span>
                      {role === "admin"
                        ? "Administrator"
                        : role === "faculty"
                          ? "Faculty"
                          : "Student"}
                    </span>
                  </SubmitButton>
                ))}
              </form>
            </section>
          )}
          {notice === "demo-unavailable" && (
            <p className="notice" role="alert">
              Demo access is temporarily unavailable. Please try again later.
            </p>
          )}
          <p className="auth-security">
            <Icon name="shield" size={14} />
            <span>
              Accounts and access are managed by your institution. Contact your
              academic administrator if you need help.
            </span>
          </p>
          <footer>Syrka Campus · Learning, thoughtfully connected.</footer>
        </section>
      </div>
    </main>
  );
}
