export type Activity = {
  id: string;
  courseId?: string;
  course: string;
  title: string;
  kind:
    | "assignment"
    | "assessment"
    | "class"
    | "event"
    | "feedback"
    | "reading"
    | "request";
  href: string;
  at?: string;
  endsAt?: string;
  availableAt?: string;
  /** Only an authorised source may supply an extension or dependency. */
  extendedUntil?: string;
  requiredBefore?: string;
  state:
    | "not-started"
    | "draft"
    | "submitted"
    | "completed"
    | "cancelled"
    | "published";
  mandatory?: boolean;
  blocked?: boolean;
  weight?: number;
  relevance?: number;
  description?: string;
};
export type LearningCourse = {
  id: string;
  code: string;
  title: string;
  credits: number;
  term: string;
  href: string;
  completed?: boolean;
};
export type AcademicUpdate = {
  id: string;
  title: string;
  body: string;
  course?: string;
  href?: string;
};
export type CommandData = {
  scope: string;
  institution: string;
  now: string;
  courses: LearningCourse[];
  activities: Activity[];
  updates: AcademicUpdate[];
  progression?: {
    goal: string;
    capability: string;
    evidenceTitle: string;
    href: string;
    state: "demo" | "connected";
  };
  demo?: boolean;
  stale?: boolean;
  limited?: boolean;
};
export type PersonalPreferences = {
  pinned: string[];
  dismissed: string[];
  resume?: string;
};
export const emptyPreferences: PersonalPreferences = {
  pinned: [],
  dismissed: [],
};

/** No academic text, email bodies or arbitrary URLs are persisted. Scope is user + institution. */
export function readPreferences(raw: string | null): PersonalPreferences {
  try {
    const data: unknown = JSON.parse(raw || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data))
      return { pinned: [], dismissed: [] };
    const record = data as Record<string, unknown>;
    const validId = (v: unknown): v is string =>
      typeof v === "string" && v.length > 0 && v.length < 180;
    const ids = (v: unknown) =>
      Array.isArray(v) ? [...new Set(v.filter(validId))].slice(0, 200) : [];
    return {
      pinned: ids(record.pinned),
      dismissed: ids(record.dismissed),
      ...(validId(record.resume) ? { resume: record.resume } : {}),
    };
  } catch {
    return { pinned: [], dismissed: [] };
  }
}

/** Dates without an explicit timezone are unknown, rather than browser-local guesses. */
export function timestamp(value?: string): number | undefined {
  if (!value || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
}

export function localDay(value: string, zone: string): string | undefined {
  const time = timestamp(value);
  if (time === undefined) return undefined;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(time);
  } catch {
    return undefined;
  }
}

/** An extension can move a deadline later; malformed values never invent a date. */
export function activityDate(a: Activity): string | undefined {
  const original = timestamp(a.at);
  const extension = timestamp(a.extendedUntil);
  if (
    !isScheduledEvent(a) &&
    extension !== undefined &&
    (original === undefined || extension > original)
  )
    return a.extendedUntil;
  return original === undefined ? undefined : a.at;
}

export function isScheduledEvent(a: Activity) {
  return a.kind === "class" || a.kind === "event";
}

export function isObligation(a: Activity) {
  return (
    ["assignment", "assessment", "request"].includes(a.kind) ||
    a.mandatory === true
  );
}

export function canDismiss(a: Activity) {
  return ["feedback", "reading"].includes(a.kind) && !isObligation(a);
}

export function eligible(a: Activity, now: number) {
  if (
    !Number.isFinite(now) ||
    ["completed", "submitted", "cancelled"].includes(a.state) ||
    a.blocked
  )
    return false;
  if (a.kind === "feedback" && a.state !== "published") return false;
  if (
    a.availableAt &&
    (timestamp(a.availableAt) === undefined || timestamp(a.availableAt)! > now)
  )
    return false;
  const date = timestamp(activityDate(a));
  const end = timestamp(a.endsAt);
  if (
    isScheduledEvent(a) &&
    (end !== undefined ? end <= now : date !== undefined && date < now)
  )
    return false;
  // Assignments have a hard transactional submission deadline on this baseline.
  // Retain the source in course history, but do not suggest an impossible submission.
  if (a.kind === "assignment" && date !== undefined && date < now) return false;
  return !(a.kind === "assessment" && date !== undefined && date <= now);
}

const publishedWeight = (a: Activity) =>
  Number.isFinite(a.weight) && a.weight! >= 0 && a.weight! <= 100
    ? a.weight!
    : 0;
const relevance = (a: Activity) =>
  Number.isFinite(a.relevance) ? a.relevance! : 0;

/** Imminent events, academic obligations, later events, feedback, then optional preparation. */
export function priority(
  a: Activity,
  now: number,
): [number, number, number, number] {
  const due = timestamp(activityDate(a)) ?? Infinity;
  const end = timestamp(a.endsAt);
  const imminentEvent =
    isScheduledEvent(a) &&
    due <= now + 30 * 60_000 &&
    (end !== undefined ? end > now : due >= now);
  const obligation = isObligation(a);
  return [
    imminentEvent
      ? 0
      : obligation
        ? 1
        : isScheduledEvent(a)
          ? 2
          : a.kind === "feedback"
            ? 3
            : 4,
    due,
    -publishedWeight(a) || 0,
    obligation ? 0 : -relevance(a) || 0,
  ];
}

/** Personal ordering never moves optional work ahead of an academic obligation. */
export function rankActivities(
  items: Activity[],
  now: string,
  prefs = emptyPreferences,
) {
  const time = timestamp(now);
  if (time === undefined) return [];
  const unique = [...new Map(items.map((a) => [a.id, a])).values()];
  return unique
    .filter(
      (a) =>
        eligible(a, time) &&
        (!canDismiss(a) || !prefs.dismissed.includes(a.id)),
    )
    .sort((a, b) => {
      const left = priority(a, time),
        right = priority(b, time);
      if (left[0] !== right[0]) return left[0] - right[0];
      const pin = (x: Activity) => (prefs.pinned.includes(x.id) ? -1 : 0);
      // Pins can reorder suggestions in their own tier; official dates always sort first.
      if (!isObligation(a) && !isScheduledEvent(a) && pin(a) !== pin(b))
        return pin(a) - pin(b);
      for (let i = 1; i < left.length; i++) {
        if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
      }
      return pin(a) - pin(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
}

/** Known deadlines stay visible before work opens or while a dependency blocks it. */
export function scheduleActivities(items: Activity[], now: string) {
  const time = timestamp(now);
  if (time === undefined) return [];
  return [...new Map(items.map((a) => [a.id, a])).values()]
    .filter((a) => {
      if (
        ["completed", "submitted", "cancelled"].includes(a.state) ||
        (!isScheduledEvent(a) && !isObligation(a))
      )
        return false;
      const date = timestamp(activityDate(a));
      if (date === undefined) return false;
      if (isScheduledEvent(a)) return (timestamp(a.endsAt) ?? date) >= time;
      return a.kind !== "assessment" || date > time;
    })
    .sort(
      (a, b) =>
        timestamp(activityDate(a))! - timestamp(activityDate(b))! ||
        (a.id < b.id ? -1 : 1),
    );
}

export function reason(a: Activity, now: string) {
  const date = timestamp(activityDate(a)),
    current = timestamp(now);
  const difference =
    date !== undefined && current !== undefined ? date - current : undefined;
  if (isScheduledEvent(a))
    return `${a.kind === "class" ? "Scheduled class" : "Scheduled event"} · ${difference !== undefined && difference <= 0 ? "In progress" : "Check the official timetable"}`;
  if (a.kind === "feedback")
    return "Published feedback · review before your next draft";
  const timing =
    difference === undefined
      ? "No deadline recorded"
      : difference < 0
        ? "Deadline has passed · check course rules"
        : difference < 86_400_000
          ? "Due within 24 hours"
          : "Upcoming scheduled work";
  return [
    a.kind === "reading" && difference === undefined
      ? "Published learning material"
      : timing,
    isObligation(a)
      ? a.mandatory
        ? "Required"
        : a.kind === "request"
          ? "Explicit request"
          : "Published course deadline"
      : "Optional preparation",
    a.requiredBefore ? `Required before ${a.requiredBefore}` : undefined,
    timestamp(a.extendedUntil) !== undefined &&
    activityDate(a) === a.extendedUntil
      ? "Confirmed extension"
      : undefined,
    a.weight !== undefined &&
    Number.isFinite(a.weight) &&
    a.weight >= 0 &&
    a.weight <= 100
      ? `${a.weight}% published weight`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function actionLabel(a: Activity) {
  return a.kind === "feedback"
    ? "Review feedback"
    : a.kind === "class"
      ? "View class"
      : a.kind === "event"
        ? "View event"
        : a.kind === "reading"
          ? "Review reading"
          : a.kind === "assessment"
            ? a.state === "draft"
              ? "Continue assessment"
              : "Open assessment"
            : a.kind === "request"
              ? "Review request"
              : a.state === "draft"
                ? "Continue assignment"
                : "Open assignment";
}
