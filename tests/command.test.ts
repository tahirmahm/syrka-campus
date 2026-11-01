import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionLabel,
  activityDate,
  canDismiss,
  eligible,
  localDay,
  priority,
  rankActivities,
  readPreferences,
  reason,
  scheduleActivities,
  timestamp,
  type Activity,
} from "../src/lib/command/model";

const now = "2026-11-01T09:00:00Z";
const time = Date.parse(now);
const activity = (id: string, change: Partial<Activity> = {}): Activity => ({
  id,
  course: "RES201",
  title: id,
  kind: "assignment",
  href: "/courses/course-id#assignments",
  state: "not-started",
  ...change,
});
const ids = (items: Activity[]) => items.map((a) => a.id);

test("imminent events and hard deadlines precede pinned, highly relevant optional work", () => {
  const items = [
    activity("reading", { kind: "reading", relevance: 1000, weight: 100 }),
    activity("later", { at: "2026-11-03T09:00:00Z", weight: 100 }),
    activity("soon", { at: "2026-11-01T12:00:00Z", weight: 1 }),
    activity("class", {
      kind: "class",
      at: "2026-11-01T09:15:00Z",
      endsAt: "2026-11-01T10:15:00Z",
    }),
  ];
  const prefs = { pinned: ["reading", "later"], dismissed: ["soon", "class"] };
  assert.deepEqual(ids(rankActivities(items, now, prefs)), [
    "class",
    "soon",
    "later",
    "reading",
  ]);
  assert.deepEqual(
    ids(items),
    ["reading", "later", "soon", "class"],
    "ranking must not mutate academic records",
  );
});

test("published assessment weight breaks equal deadline ties; goal relevance never reorders obligations", () => {
  const at = "2026-11-02T12:00:00Z";
  const items = [
    activity("low", { at, weight: 10, relevance: 100 }),
    activity("high", { at, weight: 30 }),
    activity("invalid", { at, weight: Infinity }),
  ];
  assert.deepEqual(ids(rankActivities(items, now)), ["high", "low", "invalid"]);
  assert.equal(priority(activity("invalid", { weight: 101 }), time)[2], 0);
  assert.equal(priority(activity("low", { relevance: 100 }), time)[3], 0);
});

test("pins affect optional suggestions within a tier; published feedback stays ahead of optional preparation", () => {
  const items = [
    activity("relevant", { kind: "reading", relevance: 10 }),
    activity("pinned", { kind: "reading" }),
    activity("feedback", { kind: "feedback", state: "published" }),
  ];
  assert.deepEqual(
    ids(rankActivities(items, now, { pinned: ["pinned"], dismissed: [] })),
    ["feedback", "pinned", "relevant"],
  );
  assert.deepEqual(ids(rankActivities(items.slice(0, 2), now)), [
    "relevant",
    "pinned",
  ]);
});

test("completed, submitted, cancelled, blocked and unpublished activities are never suggested", () => {
  const items = [
    activity("completed", { state: "completed" }),
    activity("submitted", { state: "submitted" }),
    activity("cancelled", { state: "cancelled" }),
    activity("blocked", { blocked: true }),
    activity("future", { availableAt: "2026-11-02T12:00:00Z" }),
    activity("invalid-availability", { availableAt: "unknown" }),
    activity("unpublished-feedback", { kind: "feedback" }),
    activity("published-feedback", { kind: "feedback", state: "published" }),
  ];
  assert.deepEqual(ids(rankActivities(items, now)), ["published-feedback"]);
});

test("assessment closure and event end boundaries respect the current instant", () => {
  assert.equal(
    eligible(activity("assessment", { kind: "assessment", at: now }), time),
    false,
  );
  assert.equal(
    eligible(
      activity("event", {
        kind: "event",
        at: "2026-11-01T08:00:00Z",
        endsAt: now,
      }),
      time,
    ),
    false,
  );
  assert.equal(
    eligible(
      activity("ongoing", {
        kind: "class",
        at: "2026-11-01T08:00:00Z",
        endsAt: "2026-11-01T10:00:00Z",
      }),
      time,
    ),
    true,
  );
  assert.equal(
    eligible(
      activity("missing-end", { kind: "class", at: "2026-11-01T08:00:00Z" }),
      time,
    ),
    false,
    "an unknown end must not imply an indefinitely ongoing class",
  );
});

test("hard assignment deadlines retain history without burying actionable work; extensions reopen eligibility", () => {
  const closed = activity("closed", {
    at: "2026-10-30T12:00:00Z",
    state: "draft",
  });
  const upcoming = activity("upcoming", { at: "2026-11-02T12:00:00Z" });
  assert.deepEqual(ids(rankActivities([closed, upcoming], now)), ["upcoming"]);
  assert.equal(
    closed.state,
    "draft",
    "personal priority state never changes the submission record",
  );
  assert.deepEqual(ids(scheduleActivities([closed, upcoming], now)), [
    "closed",
    "upcoming",
  ]);
  assert.equal(
    eligible({ ...closed, extendedUntil: "2026-11-03T12:00:00Z" }, time),
    true,
  );
  assert.match(reason(closed, now), /Deadline has passed · check course rules/);
});

test("future assessments and blocked dependencies retain their confirmed schedule without becoming next actions", () => {
  const future = activity("future-assessment", {
    kind: "assessment",
    at: "2026-11-04T12:00:00Z",
    availableAt: "2026-11-03T12:00:00Z",
  });
  const blocked = activity("blocked-assignment", {
    at: "2026-11-03T12:00:00Z",
    blocked: true,
  });
  assert.deepEqual(rankActivities([future, blocked], now), []);
  assert.deepEqual(ids(scheduleActivities([future, blocked], now)), [
    "blocked-assignment",
    "future-assessment",
  ]);
});

test("confirmed extensions control ranking, schedule and explanation without changing source dates", () => {
  const extended = activity("extended", {
    kind: "assessment",
    at: "2026-10-31T12:00:00Z",
    extendedUntil: "2026-11-04T12:00:00Z",
  });
  const soon = activity("soon", { at: "2026-11-02T12:00:00Z" });
  assert.deepEqual(ids(rankActivities([extended, soon], now)), [
    "soon",
    "extended",
  ]);
  assert.deepEqual(ids(scheduleActivities([extended, soon], now)), [
    "soon",
    "extended",
  ]);
  assert.equal(activityDate(extended), "2026-11-04T12:00:00Z");
  assert.equal(extended.at, "2026-10-31T12:00:00Z");
  assert.match(reason(extended, now), /Confirmed extension/);
  assert.equal(
    activityDate(
      activity("earlier", {
        at: "2026-11-04T12:00:00Z",
        extendedUntil: "2026-11-02T12:00:00Z",
      }),
    ),
    "2026-11-04T12:00:00Z",
  );
});

test("extensions never move scheduled events", () => {
  const event = activity("event", {
    kind: "event",
    at: "2026-11-01T10:00:00Z",
    extendedUntil: "2026-11-04T10:00:00Z",
  });
  assert.equal(activityDate(event), event.at);
});

test("dismissal applies only to optional suggestions, and source revisions can resurface", () => {
  const items = [
    activity("feedback:record:revision-1", {
      kind: "feedback",
      state: "published",
    }),
    activity("feedback:record:revision-2", {
      kind: "feedback",
      state: "published",
    }),
    activity("required-reading", { kind: "reading", mandatory: true }),
    activity("class", { kind: "class", at: "2026-11-01T10:00:00Z" }),
  ];
  const ranked = rankActivities(items, now, {
    pinned: [],
    dismissed: items
      .map((a) => a.id)
      .filter((id) => id !== "feedback:record:revision-2"),
  });
  assert.deepEqual(ids(ranked), [
    "required-reading",
    "class",
    "feedback:record:revision-2",
  ]);
  assert.equal(canDismiss(items[0]), true);
  assert.equal(canDismiss(items[2]), false);
});

test("explicit requests and mandatory dependencies precede optional preparation with concise reasons", () => {
  const request = activity("request", { kind: "request" });
  const prerequisite = activity("prerequisite", {
    kind: "reading",
    mandatory: true,
    requiredBefore: "Research methods exam",
  });
  assert.ok(
    priority(request, time)[0] <
      priority(activity("optional", { kind: "reading" }), time)[0],
  );
  assert.match(reason(request, now), /Explicit request/);
  assert.match(
    reason(prerequisite, now),
    /Required before Research methods exam/,
  );
});

test("equivalent explicit timezone offsets have equal priority", () => {
  assert.equal(timestamp("2026-11-01T14:30:00+05:30"), timestamp(now));
  assert.equal(
    priority(activity("utc", { at: now }), time)[1],
    priority(activity("offset", { at: "2026-11-01T14:30:00+05:30" }), time)[1],
  );
  assert.equal(
    timestamp("2026-11-01T09:00:00"),
    undefined,
    "ambiguous local time must remain unknown",
  );
});

test("local calendar days follow the user's timezone across midnight and daylight saving", () => {
  assert.equal(
    localDay("2026-11-01T00:30:00Z", "America/New_York"),
    "2026-10-31",
  );
  assert.equal(
    localDay("2026-11-01T06:30:00Z", "America/New_York"),
    "2026-11-01",
  );
  assert.equal(localDay("2026-11-01T00:30:00Z", "Asia/Kolkata"), "2026-11-01");
  assert.equal(localDay("invalid", "UTC"), undefined);
  assert.equal(localDay(now, "Not/AZone"), undefined);
});

test("missing and malformed deadlines stay unknown and cannot break deterministic ordering", () => {
  const items = [
    activity("z", { at: "invalid", weight: NaN }),
    activity("a"),
    activity("dated", { at: "2026-11-02T09:00:00Z" }),
  ];
  assert.deepEqual(ids(rankActivities(items, now)), ["dated", "a", "z"]);
  assert.deepEqual(ids(rankActivities([...items].reverse(), now)), [
    "dated",
    "a",
    "z",
  ]);
  assert.match(reason(items[0], now), /No deadline recorded/);
  assert.doesNotMatch(reason(items[0], now), /NaN|failing|behind|at risk/);
  assert.deepEqual(rankActivities(items, "invalid-now"), []);
});

test("shared source identities produce one activity and respect updated completion state", () => {
  const first = activity("same", { state: "draft" });
  const latest = activity("same", { state: "submitted" });
  assert.deepEqual(rankActivities([first, latest], now), []);
  assert.deepEqual(scheduleActivities([first, latest], now), []);
});

test("personal storage parses only bounded unique identifiers and rejects corrupt input", () => {
  for (const raw of [null, "{", "null", "[]", "42"])
    assert.deepEqual(readPreferences(raw), { pinned: [], dismissed: [] });
  const prefs = readPreferences(
    JSON.stringify({
      pinned: ["assignment:1", "assignment:1", 3, "", "x".repeat(180)],
      dismissed: Array.from({ length: 250 }, (_, i) => `feedback:${i}`),
      resume: "assignment:1",
      privateMessage: "must not be retained",
    }),
  );
  assert.deepEqual(prefs.pinned, ["assignment:1"]);
  assert.equal(prefs.dismissed.length, 200);
  assert.equal(prefs.resume, "assignment:1");
  assert.deepEqual(Object.keys(prefs).sort(), [
    "dismissed",
    "pinned",
    "resume",
  ]);
  assert.equal(
    readPreferences(JSON.stringify({ resume: "x".repeat(180) })).resume,
    undefined,
  );
});

test("action labels describe actual destinations and do not claim submission or joining", () => {
  assert.equal(
    actionLabel(activity("draft", { state: "draft" })),
    "Continue assignment",
  );
  assert.equal(
    actionLabel(activity("assessment", { state: "draft", kind: "assessment" })),
    "Continue assessment",
  );
  assert.equal(actionLabel(activity("event", { kind: "event" })), "View event");
  assert.equal(
    actionLabel(activity("request", { kind: "request" })),
    "Review request",
  );
  assert.equal(actionLabel(activity("class", { kind: "class" })), "View class");
});
