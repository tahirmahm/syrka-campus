import Link from "next/link";
import Image from "next/image";
import { session } from "@/lib/session";
import { logout } from "../login/actions";
import { Theme } from "@/components/theme";
export const dynamic = "force-dynamic";
export default async function Portal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await session();
  return (
    <div className="shell">
      <aside>
        <Link href="/dashboard" className="brand">
          <Image
            src="/cam/brand/symbol.jpg"
            width={48}
            height={48}
            alt="Syrka"
          />
          <span>CAMPUS</span>
        </Link>
        <p className="eyebrow">YOUR ACADEMIC SPACE</p>
        <nav aria-label="Main navigation">
          {[
            ["01", "Dashboard", "/dashboard"],
            ["02", "Courses", "/courses"],
            ["03", "Registration", "/registration"],
            ["04", "Grades", "/grades"],
            ["05", "Administration", "/admin"],
          ].map(([n, title, path]) => (
            <Link key={path} href={path}>
              <span>{n}</span>
              {title}
              <span className="arrow">↗</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Theme />
          <p className="small">{user.email}</p>
          <form action={logout}>
            <button className="quiet">Sign out →</button>
          </form>
        </div>
      </aside>
      <div className="main-wrap">
        <header>
          <span>SYRKA / CAMPUS</span>
          <span>Academic life, connected.</span>
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
