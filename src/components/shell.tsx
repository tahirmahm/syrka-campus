"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Brand } from "./brand";
import { trapDialogFocus } from "./dialog-focus";
import { Icon, type IconName } from "./icon";
import { switchInstitution } from "@/lib/actions";
import { logout } from "@/app/login/actions";
type Membership = {
  institution_id: string;
  role: string;
  institutions: unknown;
};
type Destination = { label: string; path: string; icon: IconName };
export function Shell({
  children,
  memberships,
  email,
  defaultInstitution,
  demoInstitution,
}: {
  children: React.ReactNode;
  memberships: Membership[];
  email: string;
  defaultInstitution?: string;
  demoInstitution?: string;
}) {
  const rawPath = usePathname();
  const path = rawPath.replace(/^\/cam(?=\/|$)/, "") || "/";
  const query = useSearchParams();
  const current = memberships.find(
    (m) =>
      m.institution_id === (query.get("institution") ?? defaultInstitution),
  );
  const role = current?.role ?? "account";
  const tenant = current?.institution_id;
  const demo = !!tenant && tenant === demoInstitution;
  const name =
    (current?.institutions as { name?: string } | undefined)?.name ??
    "No institution selected";
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    drawer.current?.close();
    trigger.current?.focus();
  };
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const resized = () => {
      if (media.matches) drawer.current?.close();
    };
    media.addEventListener("change", resized);
    return () => media.removeEventListener("change", resized);
  }, []);
  const destinations: Destination[] = [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    {
      label:
        role === "faculty"
          ? "Teaching courses"
          : role === "admin"
            ? "Course offerings"
            : "My courses",
      path: "/my-courses",
      icon: "book",
    },
    ...(role !== "faculty"
      ? [
          {
            label: "Course catalog",
            path: "/courses",
            icon: "catalog",
          } as Destination,
        ]
      : []),
    ...(role === "student"
      ? [
          {
            label: "Registration",
            path: "/registration",
            icon: "checks",
          } as Destination,
        ]
      : []),
    {
      label: role === "student" ? "Assignments" : "Submissions & assignments",
      path: "/assignments",
      icon: "assignment",
    },
    { label: "Assessments", path: "/assessments", icon: "assessment" },
    {
      label: role === "student" ? "Grades" : "Gradebooks",
      path: "/grades",
      icon: "grade",
    },
    { label: "Calendar", path: "/calendar", icon: "calendar" },
    { label: "My Lecture Notes", path: "/lecture-notes", icon: "notes" },
  ];
  const visibleDestinations = current ? destinations : destinations.slice(0, 1);
  const active = (dest: Destination) =>
    dest.path === "/my-courses"
      ? path === "/my-courses" || path.startsWith("/courses/")
      : dest.path === "/assessments"
        ? path.startsWith("/assessments") || path.startsWith("/attempts/")
        : path === dest.path;
  const page =
    visibleDestinations.find(active)?.label ??
    (path === "/admin" ? "Administration" : "Campus");
  function navigation() {
    return (
      <>
        <Link
          className="brand"
          href="/dashboard"
          onClick={() => drawer.current?.close()}
        >
          <Brand />
          <span>
            Campus<small>by Syrka</small>
          </span>
        </Link>
        <form action={switchInstitution} className="institution-switch">
          <label>
            <span className="field-label">
              <Icon name="institution" size={14} /> Institution
            </span>
            <select
              name="institution"
              defaultValue={tenant}
              key={tenant ?? "none"}
              aria-label="Institution"
            >
              {memberships.length ? (
                memberships.map((m) => (
                  <option key={m.institution_id} value={m.institution_id}>
                    {(m.institutions as { name?: string })?.name ??
                      m.institution_id}{" "}
                    · {m.role}
                  </option>
                ))
              ) : (
                <option>No active membership</option>
              )}
            </select>
          </label>
          {memberships.length > 1 && (
            <button className="secondary" type="submit">
              Switch institution
              <Icon name="arrow" size={15} />
            </button>
          )}
        </form>
        <nav aria-label="Main navigation">
          <p className="nav-group-label">
            {role === "faculty"
              ? "Teaching"
              : role === "admin"
                ? "Academic workspace"
                : "Learning"}
          </p>
          {visibleDestinations.map((dest) => (
            <Link
              key={dest.path}
              href={`${dest.path}${tenant ? `?institution=${tenant}` : ""}`}
              className={`nav-item ${active(dest) ? "is-active" : ""}`}
              aria-current={active(dest) ? "page" : undefined}
              onClick={() => drawer.current?.close()}
            >
              <Icon name={dest.icon} />
              <span>{dest.label}</span>
            </Link>
          ))}
          {role === "admin" && (
            <>
              <p className="nav-group-label">Institution</p>
              <Link
                href={`/admin${tenant ? `?institution=${tenant}` : ""}`}
                className={`nav-item ${path === "/admin" ? "is-active" : ""}`}
                aria-current={path === "/admin" ? "page" : undefined}
                onClick={() => drawer.current?.close()}
              >
                <Icon name="settings" />
                <span>Administration</span>
              </Link>
            </>
          )}
          <div className="nav-apps">
            <p className="nav-group-label">Syrka Apps</p>
            <a className="nav-item" href="https://www.syrka.co/workspace">
              <Icon name="workspace" />
              <span>Workspace</span>
            </a>
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar" aria-hidden="true">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <span className="profile-email" title={email}>
                {demo
                  ? `Demo ${role === "admin" ? "administrator" : role}`
                  : email}
              </span>
              <span className="profile-role">
                {role === "admin"
                  ? "Institution administrator"
                  : role === "faculty"
                    ? "Faculty member"
                    : role === "student"
                      ? "Student"
                      : "Membership pending"}
              </span>
            </div>
          </div>
          <form action={logout}>
            <button className="quiet signout" type="submit">
              <Icon name="logout" />
              Sign out
            </button>
          </form>
        </div>
      </>
    );
  }
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Campus sidebar">
        {navigation()}
      </aside>
      <div className="main-wrap">
        <header className="mobile-header">
          <button
            ref={trigger}
            type="button"
            className="icon-button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            onClick={() => drawer.current?.showModal()}
          >
            <Icon name="menu" size={22} />
          </button>
          <Link href="/dashboard" className="mobile-brand">
            <Brand />
            <span>Campus</span>
          </Link>
          <span className="role-tag">{role === "admin" ? "Admin" : role}</span>
        </header>
        <header className="topbar">
          <nav aria-label="Breadcrumb">
            <Link href="/dashboard">Campus</Link>
            <Icon name="next" size={14} />
            <span aria-current="page">{page}</span>
          </nav>
          <span className="topbar-institution">
            <Icon name="institution" size={15} />
            {name}
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {demo && (
            <div
              className="demo-banner"
              role="status"
              aria-label="Demonstration environment"
            >
              <Icon name="info" size={16} />
              <span>
                <strong>Demonstration campus</strong>
                <span className="demo-detail">
                  Sample records · Shared demo access
                </span>
              </span>
              <span className="demo-badge">Demo</span>
            </div>
          )}
          {children}
          <footer className="app-footer">
            <span>Syrka Campus</span>
            <span>Academic life, thoughtfully connected.</span>
          </footer>
        </main>
      </div>
      <dialog
        ref={drawer}
        className="navigation-drawer"
        aria-label="Campus navigation"
        onKeyDown={trapDialogFocus}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === drawer.current) close();
        }}
      >
        <button
          type="button"
          className="icon-button drawer-close"
          aria-label="Close navigation"
          onClick={close}
        >
          <Icon name="close" size={22} />
        </button>
        <div className="drawer-content">{navigation()}</div>
      </dialog>
    </div>
  );
}
