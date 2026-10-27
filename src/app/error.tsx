"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main" className="card" style={{ margin: 40 }}>
      <h1>We couldn’t complete that request.</h1>
      <p>
        Your institution’s data remains protected. Please retry or contact your
        administrator.
      </p>
      <button onClick={reset}>Try again →</button>
    </main>
  );
}
