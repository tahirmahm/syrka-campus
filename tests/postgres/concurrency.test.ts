import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
const ids = {
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  admin: "20000000-0000-4000-8000-000000000001",
  faculty: "20000000-0000-4000-8000-000000000002",
  student: "20000000-0000-4000-8000-000000000003",
  other: "20000000-0000-4000-8000-000000000004",
  second: "20000000-0000-4000-8000-000000000005",
  dept: "30000000-0000-4000-8000-000000000001",
  term: "40000000-0000-4000-8000-000000000001",
  course: "50000000-0000-4000-8000-000000000001",
  offering: "60000000-0000-4000-8000-000000000001",
  assignment: "70000000-0000-4000-8000-000000000001",
};
test("Independent PostgreSQL sessions serialize registration races", async (t) => {
  const connectionString = process.env.CAMPUS_TEST_DATABASE_URL;
  assert.ok(
    connectionString,
    "Set CAMPUS_TEST_DATABASE_URL to an EMPTY disposable PostgreSQL database",
  );
  const owner = new Client({ connectionString });
  await owner.connect();
  t.after(() => owner.end());
  // Refuse to touch any database with application tables already present.
  const existing = await owner.query(
    "select tablename from pg_tables where schemaname='public'",
  );
  assert.equal(
    existing.rowCount,
    0,
    "Database must be empty; never use a hosted Campus or Workspace database",
  );
  const db = {
    exec: (sql: string) => owner.query(sql),
    query: (sql: string, values?: unknown[]) => owner.query(sql, values),
  };
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  await db.exec(
    `create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert on storage.objects to authenticated;`,
  );
  for (const f of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  await db.query(`insert into auth.users(id) select unnest($1::uuid[])`, [
    [ids.admin, ids.faculty, ids.student, ids.other, ids.second],
  ]);
  await db.query(
    `insert into institutions(id,name,slug) values ($1,'Institution A','a'),($2,'Institution B','b')`,
    [ids.a, ids.b],
  );
  for (const [user, tenant, role] of [
    [ids.admin, ids.a, "admin"],
    [ids.faculty, ids.a, "faculty"],
    [ids.student, ids.a, "student"],
    [ids.second, ids.a, "student"],
    [ids.other, ids.b, "admin"],
  ])
    await db.query(
      `insert into memberships(institution_id,user_id,role) values($1,$2,$3)`,
      [tenant, user, role],
    );
  await db.query(
    `insert into departments(id,institution_id,name,code) values($1,$2,'Humanities','HUM')`,
    [ids.dept, ids.a],
  );
  await db.query(
    `insert into academic_terms(id,institution_id,name,starts_on,ends_on) values($1,$2,'Autumn','2026-09-01','2027-01-31')`,
    [ids.term, ids.a],
  );
  await db.query(
    `insert into courses(id,institution_id,department_id,code,title,credits) values($1,$2,$3,'HUM101','Ways of knowing',6)`,
    [ids.course, ids.a, ids.dept],
  );
  await db.query(
    `insert into offerings(id,institution_id,course_id,term_id,capacity,published,waitlist_enabled) values($1,$2,$3,$4,1,true,true)`,
    [ids.offering, ids.a, ids.course, ids.term],
  );
  await db.query(
    `insert into registration_windows(institution_id,term_id,opens_at,closes_at,withdrawal_closes_at) values($1,$2,now()-interval '1 day',now()+interval '1 day',now()+interval '2 days')`,
    [ids.a, ids.term],
  );
  await db.query(
    `insert into faculty_assignments(institution_id,offering_id,user_id) values($1,$2,$3)`,
    [ids.a, ids.offering, ids.faculty],
  );

  const clients: Client[] = [];
  async function student(user: string) {
    const client = new Client({ connectionString });
    await client.connect();
    clients.push(client);
    await client.query("select set_config('request.jwt.claim.sub',$1,false)", [
      user,
    ]);
    await client.query("set role authenticated");
    await client.query("set statement_timeout='5s'");
    return client;
  }
  t.after(async () => {
    await Promise.all(clients.map((c) => c.end()));
  });
  async function race(
    first: Client,
    second: Client,
    offeringA = ids.offering,
    offeringB = ids.offering,
  ) {
    // The first session holds its successful registration uncommitted while
    // the second must block on the actual database lock.
    await first.query("begin");
    await first.query("select register_course($1,$2)", [ids.a, offeringA]);
    let finished = false;
    const pending = second
      .query("select register_course($1,$2)", [ids.a, offeringB])
      .then(
        (value) => ({ value, error: undefined as Error | undefined }),
        (error) => ({ value: undefined, error: error as Error }),
      )
      .finally(() => {
        finished = true;
      });
    // Poll server-observed lock contention, rather than assume timing from a sleep.
    let blocked = false;
    for (let i = 0; i < 100; i++) {
      const activity = await owner.query(
        "select 1 from pg_stat_activity where wait_event_type='Lock' and query like 'select register_course%' and datname=current_database()",
      );
      if (activity.rowCount) {
        blocked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.ok(
      blocked,
      "Second independent session must wait for the registration lock",
    );
    assert.equal(finished, false);
    await first.query("commit");
    return pending;
  }
  const first = await student(ids.student);
  const second = await student(ids.second);
  await t.test("Last seat cannot be over-enrolled", async () => {
    await owner.query("update offerings set waitlist_enabled=false");
    const result = await race(first, second);
    assert.match(result.error?.message ?? "", /Course is full/);
    assert.equal(
      (
        await owner.query(
          "select count(*)::int as count from enrollments where status='enrolled'",
        )
      ).rows[0].count,
      1,
    );
  });
  await t.test(
    "Simultaneous repeat registration cannot create duplicates",
    async () => {
      await owner.query("truncate enrollments");
      const sameUser = await student(ids.student);
      const result = await race(first, sameUser);
      assert.match(result.error?.message ?? "", /Already registered/);
      assert.equal(
        (await owner.query("select count(*)::int as count from enrollments"))
          .rows[0].count,
        1,
      );
    },
  );
  await t.test(
    "Different sections of the same course cannot race past duplicate checks",
    async () => {
      await owner.query("truncate enrollments");
      const alternate = "60000000-0000-4000-8000-000000000002";
      await owner.query(
        "insert into offerings(id,institution_id,course_id,term_id,section,capacity,published) values($1,$2,$3,$4,'B',1,true)",
        [alternate, ids.a, ids.course, ids.term],
      );
      const sameUser = await student(ids.student);
      const result = await race(first, sameUser, ids.offering, alternate);
      assert.match(
        result.error?.message ?? "",
        /Already registered for this course/,
      );
      assert.equal(
        (await owner.query("select count(*)::int as count from enrollments"))
          .rows[0].count,
        1,
      );
    },
  );
  await t.test(
    "Last-seat race assigns the second student to the waitlist",
    async () => {
      await owner.query("truncate enrollments");
      await owner.query("update offerings set waitlist_enabled=true");
      const result = await race(first, second);
      assert.equal(result.error, undefined);
      assert.equal(result.value?.rows[0].register_course, "waitlisted");
      const counts = await owner.query(
        "select status,count(*)::int as count from enrollments group by status order by status",
      );
      assert.deepEqual(counts.rows, [
        { status: "enrolled", count: 1 },
        { status: "waitlisted", count: 1 },
      ]);
    },
  );
});
