import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
export default function NotFound() {
  return (
    <main id="main" className="system-state">
      <section className="card">
        <Brand wordmark />
        <p className="eyebrow">Page unavailable</p>
        <h1>We couldn’t find that page.</h1>
        <p>
          The address may have changed, or this page is unavailable to your
          account.
        </p>
        <Link className="button" href="/dashboard">
          Return to Campus <Icon name="arrow" size={17} />
        </Link>
      </section>
    </main>
  );
}
