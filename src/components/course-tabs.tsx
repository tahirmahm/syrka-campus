"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon, type IconName } from "./icon";
const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const items: { id: string; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "book" },
  { id: "modules", label: "Modules", icon: "folder" },
  { id: "readings", label: "Readings", icon: "file" },
  { id: "assignments", label: "Assignments", icon: "assignment" },
  { id: "assessments", label: "Assessments", icon: "assessment" },
  { id: "announcements", label: "Announcements", icon: "info" },
  { id: "sessions", label: "Sessions & notes", icon: "video" },
];
export function CourseTabs({
  tenant,
  offering,
  teaches,
  overviewOnly = false,
}: {
  tenant: string;
  offering: string;
  teaches: boolean;
  overviewOnly?: boolean;
}) {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash || "#overview",
    () => "#overview",
  );
  return (
    <nav className="course-tabs" aria-label="Course navigation">
      {items
        .filter((i) => !overviewOnly || i.id === "overview")
        .map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            aria-current={hash === `#${i.id}` ? "location" : undefined}
          >
            <Icon name={i.icon} size={14} />
            {i.label}
          </a>
        ))}
      <Link href={`/courses/${offering}/records?institution=${tenant}`}>
        <Icon name="grade" size={14} />
        Grades & records
      </Link>
      {teaches && (
        <a
          href="#teaching"
          aria-current={hash === "#teaching" ? "location" : undefined}
        >
          <Icon name="settings" size={14} />
          Teaching tools
        </a>
      )}
    </nav>
  );
}
