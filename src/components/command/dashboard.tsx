"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Icon } from "../icon";
import {
  rankActivities,
  scheduleActivities,
  activityDate,
  timestamp,
  isScheduledEvent,
  canDismiss,
  eligible,
  reason,
  actionLabel,
  localDay,
  readPreferences,
  type CommandData,
  type Activity,
  type PersonalPreferences,
} from "@/lib/command/model";
const subscribe = (fn: () => void) => {
  window.addEventListener("campus-priorities", fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener("campus-priorities", fn);
    window.removeEventListener("storage", fn);
  };
};
const noSubscribe = () => () => {};
const subscribeClock = (fn: () => void) => {
  const timer = window.setInterval(fn, 30_000);
  window.addEventListener("visibilitychange", fn);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("visibilitychange", fn);
  };
};
const browserMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
const subscribeViewport = (fn: () => void) => {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", fn);
  return () => media.removeEventListener("change", fn);
};
const desktopViewport = () => window.matchMedia("(min-width: 768px)").matches;
export function CommandDashboard({ data }: { data: CommandData }) {
  const key = `campus-priorities:v1:${data.scope}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const prefs = useMemo(() => readPreferences(raw), [raw]);
  const zone = useSyncExternalStore(noSubscribe, browserZone, () => "UTC");
  const currentMinute = useSyncExternalStore(
    subscribeClock,
    browserMinute,
    () => Date.parse(data.now),
  );
  const now = data.demo
    ? data.now
    : new Date(Math.max(currentMinute, Date.parse(data.now))).toISOString();
  const stale =
    data.stale ||
    (!data.demo && currentMinute - Date.parse(data.now) > 5 * 60_000);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [storageError, setStorageError] = useState(false);
  const desktop = useSyncExternalStore(
    subscribeViewport,
    desktopViewport,
    () => false,
  );
  const [contextOpen, setContextOpen] = useState<boolean | undefined>();
  const change = (update: Partial<PersonalPreferences>) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...prefs, ...update }));
      window.dispatchEvent(new Event("campus-priorities"));
    } catch {
      setStorageError(true);
    }
  };
  const ranked = rankActivities(data.activities, now, prefs);
  const scheduled = scheduleActivities(data.activities, now);
  const next = ranked[0];
  const resume = data.activities.find(
    (a) => a.id === prefs.resume && eligible(a, Date.parse(now)),
  );
  const at = (value?: string) =>
    timestamp(value) !== undefined
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value!))
      : "No date recorded";
  const today = (a: Activity) =>
    !!activityDate(a) &&
    localDay(activityDate(a)!, zone) === localDay(now, zone);
  const todayItems = scheduled.filter((a) => a.id !== next?.id && today(a));
  const thisWeek = scheduled.filter(
    (a) =>
      timestamp(activityDate(a))! >= Date.parse(now) &&
      timestamp(activityDate(a))! < Date.parse(now) + 7 * 86400000 &&
      a.id !== next?.id &&
      !today(a),
  );
  const visibleCourses = data.courses.filter(
    (c) =>
      `${c.title} ${c.code}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter !== "completed" || c.completed) &&
      (filter !== "active" || !c.completed),
  );
  const remember = (a: Activity) => change({ resume: a.id });
  const togglePin = (a: Activity) =>
    change({
      pinned: prefs.pinned.includes(a.id)
        ? prefs.pinned.filter((id) => id !== a.id)
        : [...prefs.pinned, a.id],
    });
  function row(a: Activity) {
    return (
      <article className="command-row" data-activity-id={a.id} key={a.id}>
        <span className={`activity-glyph kind-${a.kind}`}>
          <Icon
            name={
              isScheduledEvent(a)
                ? "calendar"
                : a.kind === "feedback"
                  ? "grade"
                  : a.kind === "reading"
                    ? "file"
                    : "assignment"
            }
          />
        </span>
        <div>
          <span className="command-meta">
            {a.course} · {a.kind}
          </span>
          <Link href={a.href} onClick={() => remember(a)}>
            {a.title}
          </Link>
          <small>
            {at(activityDate(a))}
            {a.kind === "assignment" &&
            timestamp(activityDate(a))! < Date.parse(now)
              ? " · Deadline passed · check course rules"
              : ""}
            {a.availableAt && timestamp(a.availableAt)! > Date.parse(now)
              ? ` · Opens ${at(a.availableAt)}`
              : a.blocked
                ? " · Check course requirements"
                : ""}
          </small>
        </div>
        <div className="row">
          <button
            type="button"
            className="quiet"
            aria-label={`${prefs.pinned.includes(a.id) ? "Unpin" : "Pin"} ${a.title}`}
            aria-pressed={prefs.pinned.includes(a.id)}
            onClick={() => togglePin(a)}
          >
            <Icon name="pin" size={15} />
          </button>
          <Link
            href={a.href}
            aria-label={`Open ${a.title}`}
            onClick={() => remember(a)}
          >
            <Icon name="next" />
          </Link>
        </div>
      </article>
    );
  }
  return (
    <div className="command-centre">
      <header className="command-heading">
        <div>
          <p className="eyebrow">{data.institution}</p>
          <h1>Dashboard</h1>
          <p className="command-meta">
            {new Intl.DateTimeFormat("en-GB", {
              timeZone: zone,
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date(now))}{" "}
            · {zone}
            {data.demo ? " · Fictional reference time" : ""}
          </p>
        </div>
        <div className="command-tools">
          {resume && (
            <Link className="button secondary" href={resume.href}>
              Resume learning <Icon name="arrow" size={15} />
            </Link>
          )}
          <details className="app-launcher">
            <summary>
              <Icon name="apps" /> Apps
            </summary>
            <div>
              <a href="https://www.syrka.co/workspace">
                Workspace <Icon name="external" size={14} />
              </a>
              <Link href="/calendar">Academic Calendar</Link>
              <Link href="/connections">Connections</Link>
              <Link href="/experience-demo">Fictional journeys</Link>
            </div>
          </details>
        </div>
      </header>
      {stale && (
        <p className="notice" role="status">
          Academic data may be stale.{" "}
          <button className="quiet" onClick={() => location.reload()}>
            Refresh records
          </button>
        </p>
      )}
      {data.limited && (
        <p className="notice" role="status">
          Showing a limited set of records. Open a course or Calendar for the
          full record.
        </p>
      )}
      {storageError && (
        <p role="status" className="notice">
          Browser storage is unavailable. Personal preferences were not saved.
        </p>
      )}
      <div className="command-layout">
        <div className="command-main">
          <section className="next-up" aria-labelledby="next-up-heading">
            <div className="next-label">
              <Icon name="route" />
              <h2 id="next-up-heading">Next up</h2>
              <span className="pill">
                {next?.state.replace("-", " ") ?? "Clear"}
              </span>
            </div>
            {next ? (
              <>
                <p className="command-meta">
                  {next.course} · {next.kind}
                </p>
                <h3>{next.title}</h3>
                <p className="priority-reason">{reason(next, now)}</p>
                {activityDate(next) && (
                  <p className="command-meta">{at(activityDate(next))}</p>
                )}
                <div className="next-actions">
                  <Link
                    className="button"
                    href={next.href}
                    onClick={() => remember(next)}
                  >
                    {actionLabel(next)} <Icon name="arrow" size={16} />
                  </Link>
                  <button
                    className="quiet"
                    aria-pressed={prefs.pinned.includes(next.id)}
                    onClick={() => togglePin(next)}
                  >
                    <Icon name="pin" size={15} />
                    {prefs.pinned.includes(next.id) ? "Pinned" : "Pin"}
                  </button>
                  {canDismiss(next) && (
                    <button
                      className="quiet"
                      onClick={() =>
                        change({ dismissed: [...prefs.dismissed, next.id] })
                      }
                    >
                      Dismiss suggestion
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3>No immediate action</h3>
                <p className="command-meta">
                  Open a course to continue learning.
                </p>
                <Link href="/my-courses" className="button">
                  My courses <Icon name="arrow" size={16} />
                </Link>
              </>
            )}
          </section>
          <section className="command-section">
            <div className="section-heading">
              <h2>Today</h2>
              <span className="command-meta">
                {todayItems.length} other scheduled items
              </span>
            </div>
            <div className="today-layout">
              <div>
                <h3 className="subheading">Scheduled events</h3>
                {todayItems.filter(isScheduledEvent).map(row)}
                {!todayItems.some(isScheduledEvent) && (
                  <p className="compact-empty">
                    No other events scheduled today.
                  </p>
                )}
              </div>
              <div>
                <h3 className="subheading">Tasks & deadlines</h3>
                {todayItems.filter((a) => !isScheduledEvent(a)).map(row)}
                {!todayItems.some((a) => !isScheduledEvent(a)) && (
                  <p className="compact-empty">No other deadlines today.</p>
                )}
              </div>
            </div>
          </section>
          <section className="command-section">
            <div className="section-heading">
              <h2>Your courses</h2>
              <Link href="/my-courses" className="text-link">
                View all <Icon name="arrow" size={14} />
              </Link>
            </div>
            <div className="command-filters">
              <label>
                <span className="sr-only">Search learning</span>
                <Icon name="search" size={16} />
                <input
                  placeholder="Search courses or codes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Course status</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All courses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
            <div className="command-course-grid">
              {visibleCourses.map((c) => {
                const activity = ranked.find((a) => a.courseId === c.id);
                const outstanding = data.activities.filter(
                  (a) =>
                    a.courseId === c.id &&
                    ["assignment", "assessment"].includes(a.kind) &&
                    !["completed", "submitted", "cancelled"].includes(a.state),
                );
                const feedback = data.activities.filter(
                  (a) => a.courseId === c.id && a.kind === "feedback",
                );
                return (
                  <article className="learning-course" key={c.id}>
                    <div className="card-top">
                      <span className="eyebrow">{c.code}</span>
                      <span className="pill">{c.credits} credits</span>
                    </div>
                    <h3>
                      <Link href={c.href}>{c.title}</Link>
                    </h3>
                    <p className="command-meta">
                      {c.term}
                      {c.completed ? " · Completed" : ""}
                    </p>
                    <div
                      className="course-next"
                      data-activity-id={activity?.id}
                    >
                      <Icon name="next" size={15} />
                      <span>
                        {activity
                          ? (activity.id === next?.id ? "In Next up: " : "") +
                            activity.title
                          : c.completed
                            ? "Review completed work"
                            : "Open materials to continue"}
                      </span>
                    </div>
                    <footer>
                      <span>
                        {data.limited ? "At least " : ""}
                        {outstanding.length} outstanding · {feedback.length}{" "}
                        published feedback
                      </span>
                      <Link href={c.href} aria-label={`Open course ${c.title}`}>
                        <Icon name="arrow" size={17} />
                      </Link>
                    </footer>
                  </article>
                );
              })}
            </div>
            {!visibleCourses.length && (
              <p className="compact-empty">No matching courses.</p>
            )}
          </section>
          <section className="command-section">
            <div className="section-heading">
              <h2>This week</h2>
              <Link className="text-link" href="/calendar">
                Open Calendar <Icon name="arrow" size={14} />
              </Link>
            </div>
            {thisWeek.slice(0, 8).map(row)}
            {!thisWeek.length && (
              <p className="compact-empty">
                No additional dates in the next seven days. Next up and Today
                show the nearest activities.
              </p>
            )}
          </section>
        </div>
        <aside className="command-aside" aria-label="Academic context">
          <details className="command-context" open={contextOpen ?? desktop}>
            <summary
              onClick={(e) => {
                e.preventDefault();
                setContextOpen(!(contextOpen ?? desktop));
              }}
            >
              <Icon name="info" size={17} /> Academic updates &amp; progression
            </summary>
            <section className="context-panel">
              <div className="section-heading">
                <h2>Academic updates</h2>
                <Icon name="info" size={17} />
              </div>
              {data.updates.slice(0, 4).map((u) => (
                <article className="academic-update" key={u.id}>
                  <span className="command-meta">
                    {u.course ?? "Institution announcement"}
                  </span>
                  <h3>
                    {u.href ? <Link href={u.href}>{u.title}</Link> : u.title}
                  </h3>
                  <p>{u.body}</p>
                </article>
              ))}
              {!data.updates.length && (
                <p className="compact-empty">No published updates.</p>
              )}
              <Link href="/connections#mail" className="connection-note">
                <Icon name="mail" size={15} /> Mail is not connected{" "}
                <Icon name="next" size={14} />
              </Link>
            </section>
            <section className="context-panel progression-panel">
              <Icon name="route" />
              <h2>Your progression</h2>
              {data.progression ? (
                <>
                  <span className="pill">
                    {data.progression.state === "demo"
                      ? "Example mapping"
                      : "Connected goal"}
                  </span>
                  <h3>{data.progression.goal}</h3>
                  <p>
                    {data.progression.evidenceTitle} ·{" "}
                    {data.progression.capability}
                  </p>
                  <Link href={data.progression.href} className="text-link">
                    Review supporting evidence <Icon name="arrow" size={14} />
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    {data.courses.filter((c) => c.completed).length} completed
                    courses in your current record.
                  </p>
                  <p className="command-meta">
                    Connect a selected goal before mapping coursework to
                    capabilities.
                  </p>
                  <Link href="/connections#roadmaps" className="text-link">
                    Review connections <Icon name="arrow" size={14} />
                  </Link>
                </>
              )}
            </section>
            {(prefs.dismissed.length > 0 || prefs.pinned.length > 0) && (
              <button
                className="quiet"
                onClick={() => change({ pinned: [], dismissed: [] })}
              >
                Reset personal suggestions
              </button>
            )}
          </details>
        </aside>
      </div>
    </div>
  );
}
