import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
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
test("Two institutions: pilot journey and authorization boundaries", async (t) => {
  const db = new PGlite();
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
  const as = async (user: string) => {
    await db.exec("reset role");
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
      user,
    ]);
    await db.exec("set role authenticated");
  };
  await t.test(
    "Foreign institution cannot read courses, offerings, memberships or audit records",
    async () => {
      await as(ids.other);
      for (const table of [
        "courses",
        "offerings",
        "memberships",
        "audit_logs",
      ]) {
        const { rows } = await db.query(
          `select * from ${table} where institution_id=$1`,
          [ids.a],
        );
        assert.equal(rows.length, 0, table);
      }
      await assert.rejects(
        db.query(
          `insert into departments(institution_id,name,code) values($1,'Intrusion','BAD')`,
          [ids.a],
        ),
        /row-level security/,
      );
    },
  );
  await t.test(
    "Tenant consistency rejects a course referring to a foreign department",
    async () => {
      await db.exec("reset role");
      await assert.rejects(
        db.query(
          `insert into courses(institution_id,department_id,code,title,credits) values($1,$2,'BAD','Bad',1)`,
          [ids.b, ids.dept],
        ),
        /foreign key/,
      );
    },
  );
  await t.test(
    "Student cannot elevate membership or write enrollments directly",
    async () => {
      await as(ids.student);
      await db.query(`update memberships set role='admin' where user_id=$1`, [
        ids.student,
      ]);
      const { rows } = await db.query<{ role: string }>(
        `select role from memberships where user_id=$1`,
        [ids.student],
      );
      assert.equal(rows[0].role, "student");
      await assert.rejects(
        db.query(
          `insert into enrollments(institution_id,offering_id,user_id,status) values($1,$2,$3,'enrolled')`,
          [ids.a, ids.offering, ids.student],
        ),
        /row-level security/,
      );
    },
  );
  await t.test(
    "Registration respects capacity, duplicate prevention, waitlist and withdrawal promotion",
    async () => {
      await as(ids.student);
      assert.equal(
        (
          await db.query<{ register_course: string }>(
            `select register_course($1,$2)`,
            [ids.a, ids.offering],
          )
        ).rows[0].register_course,
        "enrolled",
      );
      await assert.rejects(
        db.query(`select register_course($1,$2)`, [ids.a, ids.offering]),
        /Already registered/,
      );
      await as(ids.second);
      assert.equal(
        (
          await db.query<{ register_course: string }>(
            `select register_course($1,$2)`,
            [ids.a, ids.offering],
          )
        ).rows[0].register_course,
        "waitlisted",
      );
      await as(ids.student);
      await db.query(`select register_course($1,$2,true)`, [
        ids.a,
        ids.offering,
      ]);
      await as(ids.second);
      assert.equal(
        (
          await db.query<{ status: string }>(
            `select status from enrollments where user_id=$1`,
            [ids.second],
          )
        ).rows[0].status,
        "enrolled",
      );
      await db.query(`select register_course($1,$2,true)`, [
        ids.a,
        ids.offering,
      ]);
      await as(ids.student);
      await db.query(`select register_course($1,$2)`, [ids.a, ids.offering]);
    },
  );
  await t.test(
    "Assigned faculty publish assignment; student saves draft and submits",
    async () => {
      await as(ids.faculty);
      await db.query(
        `insert into assignments(id,institution_id,offering_id,title,instructions,due_at,max_points,published) values($1,$2,$3,'Reflection','Discuss the reading',now()+interval '1 day',100,true)`,
        [ids.assignment, ids.a, ids.offering],
      );
      await as(ids.student);
      await db.query(`select submit_assignment($1,$2,'My draft',false)`, [
        ids.a,
        ids.assignment,
      ]);
      await db.query(
        `select submit_assignment($1,$2,'My final response',true)`,
        [ids.a, ids.assignment],
      );
      await assert.rejects(
        db.query(`select submit_assignment($1,$2,'Another response',true)`, [
          ids.a,
          ids.assignment,
        ]),
        /Submission limit/,
      );
    },
  );
  const submission = (
    await db.query<{ id: string }>("select id from submissions")
  ).rows[0].id;
  await t.test(
    "Foreign administrator cannot grade or read submission",
    async () => {
      await as(ids.other);
      assert.equal(
        (await db.query("select * from submissions")).rows.length,
        0,
      );
      await assert.rejects(
        db.query(`select grade_submission($1,$2,90,'Unauthorized',true)`, [
          ids.a,
          submission,
        ]),
        /not authorized/,
      );
    },
  );
  await t.test(
    "Draft grade confidential; published feedback visible only to owner and authorized staff",
    async () => {
      await as(ids.faculty);
      await db.query(`select grade_submission($1,$2,86,'Well argued',false)`, [
        ids.a,
        submission,
      ]);
      await as(ids.student);
      assert.equal((await db.query("select * from grades")).rows.length, 0);
      await as(ids.faculty);
      await db.query(`select grade_submission($1,$2,86,'Well argued',true)`, [
        ids.a,
        submission,
      ]);
      await as(ids.student);
      assert.equal(
        (await db.query<{ points: string }>("select points from grades"))
          .rows[0].points,
        "86",
      );
      await as(ids.second);
      assert.equal((await db.query("select * from grades")).rows.length, 0);
      await as(ids.other);
      assert.equal((await db.query("select * from grades")).rows.length, 0);
    },
  );
  await t.test(
    "Admin oversight has enrollment, grade and audit access",
    async () => {
      await as(ids.admin);
      assert.equal((await db.query("select * from grades")).rows.length, 1);
      assert.ok((await db.query("select * from audit_logs")).rows.length > 0);
      assert.equal(
        (await db.query("select * from enrollments")).rows.length,
        2,
      );
    },
  );
  await t.test(
    "Unreleased assessment tables deny all user access",
    async () => {
      await as(ids.admin);
      for (const name of ["answer_keys", "questions", "assessments"])
        assert.equal((await db.query(`select * from ${name}`)).rows.length, 0);
    },
  );
  await t.test(
    "Private course files require published metadata and authorized course access",
    async () => {
      const path = `${ids.a}/${ids.offering}/reading.pdf`;
      await as(ids.faculty);
      await db.query(
        `insert into storage.objects(bucket_id,name) values('campus-materials',$1)`,
        [path],
      );
      await db.query(
        `insert into materials(institution_id,offering_id,title,object_path,published) values($1,$2,'Reading',$3,false)`,
        [ids.a, ids.offering, path],
      );
      await as(ids.student);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        0,
      );
      await as(ids.faculty);
      await db.query(
        `update materials set published=true where object_path=$1`,
        [path],
      );
      await as(ids.student);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        1,
      );
      await assert.rejects(
        db.query(
          `insert into storage.objects(bucket_id,name) values('campus-materials',$1)`,
          [path + ".other"],
        ),
        /row-level security/,
      );
      await as(ids.other);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        0,
      );
      await as(ids.second);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        0,
      );
    },
  );
  await t.test(
    "Timed assessments protect keys, freeze questions, mark answers and gate results",
    async () => {
      const exam = "80000000-0000-4000-8000-000000000001";
      await as(ids.faculty);
      await db.query(
        "insert into assessments(id,institution_id,offering_id,title,kind,opens_at,closes_at,time_limit_minutes,attempt_limit,published,randomized) values($1,$2,$3,'Reading quiz','quiz',now()-interval '1 hour',now()+interval '1 hour',30,1,true,true)",
        [exam, ids.a, ids.offering],
      );
      async function question(content: unknown) {
        return (
          await db.query<{ author_question: string }>(
            "select author_question($1,$2,$3::jsonb)",
            [ids.a, exam, JSON.stringify(content)],
          )
        ).rows[0].author_question;
      }
      const choice = await question({
        kind: "single",
        prompt: "Choose A",
        points: 10,
        options: [
          { body: "A", correct: true },
          { body: "B", correct: false },
        ],
      });
      const multiple = await question({
        kind: "multiple",
        prompt: "Choose A and C",
        points: 10,
        options: [
          { body: "A", correct: true },
          { body: "B", correct: false },
          { body: "C", correct: true },
        ],
      });
      const short = await question({
        kind: "short",
        prompt: "Name the campus",
        points: 10,
        expected: "Syrka",
      });
      const essay = await question({
        kind: "essay",
        prompt: "Explain your reasoning",
        points: 20,
      });
      await assert.rejects(
        question({
          kind: "single",
          prompt: "Invalid",
          points: 10,
          options: [
            { body: "A", correct: false },
            { body: "B", correct: false },
          ],
        }),
        /Invalid correct/,
      );
      const keyRows = (
        await db.query<{ question_id: string; option_id: string }>(
          "select question_id,option_id from answer_keys where option_id is not null",
        )
      ).rows;
      await as(ids.student);
      for (const table of [
        "answer_keys",
        "questions",
        "answer_options",
        "assessment_attempts",
        "assessment_responses",
      ])
        assert.equal(
          (await db.query(`select * from ${table}`)).rows.length,
          0,
          table,
        );
      await assert.rejects(
        db.query("select * from attempt_questions"),
        /permission denied/,
      );
      const attempt = (
        await db.query<{ start_assessment: string }>(
          "select start_assessment($1,$2)",
          [ids.a, exam],
        )
      ).rows[0].start_assessment;
      assert.equal(
        (
          await db.query<{ start_assessment: string }>(
            "select start_assessment($1,$2)",
            [ids.a, exam],
          )
        ).rows[0].start_assessment,
        attempt,
        "Resume same live attempt",
      );
      async function read() {
        return (
          await db.query<{
            read_attempt: {
              questions: {
                id: string;
                prompt: string;
                points: number | null;
                feedback: string | null;
              }[];
              results_published: boolean;
            };
          }>("select read_attempt($1,$2)", [ids.a, attempt])
        ).rows[0].read_attempt;
      }
      assert.equal((await read()).questions.length, 4);
      assert.ok(!JSON.stringify(await read()).includes("marking_key"));
      await as(ids.faculty);
      await db.query(
        "update questions set prompt='Changed after start',points=99 where id=$1",
        [choice],
      );
      await as(ids.student);
      assert.equal(
        (await read()).questions.find((q) => q.id === choice)?.prompt,
        "Choose A",
      );
      await assert.rejects(
        db.query("select save_attempt($1,$2,$3::jsonb,false)", [
          ids.a,
          attempt,
          JSON.stringify({ [ids.assignment]: "Foreign question" }),
        ]),
        /not part of attempt/,
      );
      const answers = {
        [choice]: keyRows
          .filter((k) => k.question_id === choice)
          .map((k) => k.option_id),
        [multiple]: keyRows
          .filter((k) => k.question_id === multiple)
          .map((k) => k.option_id),
        [short]: "  SYRKA ",
        [essay]: "A considered response",
      };
      await db.query("select save_attempt($1,$2,$3::jsonb,true)", [
        ids.a,
        attempt,
        JSON.stringify(answers),
      ]);
      assert.ok(
        (await read()).questions.every((q) => q.points === null),
        "Unpublished marks must be absent from RPC",
      );
      await assert.rejects(
        db.query("select save_attempt($1,$2,'{}',false)", [ids.a, attempt]),
        /already submitted/,
      );
      await assert.rejects(
        db.query("select start_assessment($1,$2)", [ids.a, exam]),
        /Attempt limit/,
      );
      await as(ids.other);
      await assert.rejects(read(), /access denied/);
      await assert.rejects(
        db.query("select mark_response($1,$2,$3,15,'Bad')", [
          ids.a,
          attempt,
          essay,
        ]),
        /access denied/,
      );
      await as(ids.second);
      await assert.rejects(read(), /access denied/);
      await as(ids.faculty);
      assert.equal(
        (await read()).questions.find((q) => q.id === choice)?.points,
        10,
      );
      assert.equal(
        (await read()).questions.find((q) => q.id === multiple)?.points,
        10,
      );
      assert.equal(
        (await read()).questions.find((q) => q.id === short)?.points,
        10,
      );
      assert.equal(
        (await read()).questions.find((q) => q.id === essay)?.points,
        null,
      );
      await assert.rejects(
        db.query("select mark_response($1,$2,$3,21,'Too high')", [
          ids.a,
          attempt,
          essay,
        ]),
        /Invalid grade/,
      );
      await db.query("select mark_response($1,$2,$3,17,'Well reasoned')", [
        ids.a,
        attempt,
        essay,
      ]);
      await db.query(
        "update assessments set results_published=true where id=$1",
        [exam],
      );
      await as(ids.student);
      assert.equal(
        (await read()).questions.find((q) => q.id === essay)?.points,
        17,
      );
      assert.equal(
        (await read()).questions.find((q) => q.id === essay)?.feedback,
        "Well reasoned",
      );
      assert.equal(
        (await db.query("select * from assessment_responses")).rows.length,
        0,
        "Direct table queries must not bypass publication RPC",
      );
    },
  );
  await t.test(
    "Expired assessment finalizes only responses saved before expiry",
    async () => {
      const exam = "80000000-0000-4000-8000-000000000002";
      await as(ids.faculty);
      await db.query(
        "insert into assessments(id,institution_id,offering_id,title,kind,opens_at,closes_at,published) values($1,$2,$3,'Expiry','exam',now()-interval '1 hour',now()+interval '1 hour',true)",
        [exam, ids.a, ids.offering],
      );
      const question = (
        await db.query<{ author_question: string }>(
          "select author_question($1,$2,$3::jsonb)",
          [
            ids.a,
            exam,
            JSON.stringify({
              kind: "short",
              prompt: "Name",
              points: 5,
              expected: "Syrka",
            }),
          ],
        )
      ).rows[0].author_question;
      await as(ids.student);
      const attempt = (
        await db.query<{ start_assessment: string }>(
          "select start_assessment($1,$2)",
          [ids.a, exam],
        )
      ).rows[0].start_assessment;
      await db.query("select save_attempt($1,$2,$3::jsonb,false)", [
        ids.a,
        attempt,
        JSON.stringify({ [question]: "Wrong" }),
      ]);
      await db.exec("reset role");
      await db.query(
        "update assessment_attempts set expires_at=now()-interval '1 second' where id=$1",
        [attempt],
      );
      await as(ids.student);
      await assert.rejects(
        db.query("select save_attempt($1,$2,$3::jsonb,false)", [
          ids.a,
          attempt,
          JSON.stringify({ [question]: "Syrka" }),
        ]),
        /expired/,
      );
      await db.query("select save_attempt($1,$2,$3::jsonb,true)", [
        ids.a,
        attempt,
        JSON.stringify({ [question]: "Syrka" }),
      ]);
      await as(ids.faculty);
      const result = (
        await db.query<{
          read_attempt: { questions: { points: number; response: string }[] };
        }>("select read_attempt($1,$2)", [ids.a, attempt])
      ).rows[0].read_attempt;
      assert.equal(result.questions[0].points, 0);
      assert.equal(result.questions[0].response, "Wrong");
    },
  );
  await t.test(
    "Attendance, calendar and final gradebook retain tenant and publication boundaries",
    async () => {
      await as(ids.faculty);
      await db.query(
        "insert into attendance(institution_id,offering_id,user_id,session_date,status) values($1,$2,$3,'2026-10-27','present')",
        [ids.a, ids.offering, ids.student],
      );
      await db.query(
        "insert into calendar_events(institution_id,offering_id,title,starts_at,ends_at) values($1,$2,'Seminar',now(),now()+interval '1 hour')",
        [ids.a, ids.offering],
      );
      const category = (
        await db.query<{ id: string }>(
          "insert into grade_categories(institution_id,offering_id,name,weight) values($1,$2,'Coursework',1) returning id",
          [ids.a, ids.offering],
        )
      ).rows[0].id;
      await db.query(
        "insert into grade_items(institution_id,category_id,assignment_id,title) values($1,$2,$3,'Reflection')",
        [ids.a, category, ids.assignment],
      );
      assert.equal(
        Number(
          (
            await db.query<{ calculate_course_grade: string }>(
              "select calculate_course_grade($1,$2,$3,'Good progress',false)",
              [ids.a, ids.offering, ids.student],
            )
          ).rows[0].calculate_course_grade,
        ),
        86,
      );
      await as(ids.student);
      assert.equal(
        (await db.query("select * from course_grades")).rows.length,
        0,
      );
      assert.equal((await db.query("select * from attendance")).rows.length, 1);
      assert.equal(
        (await db.query("select * from calendar_events")).rows.length,
        1,
      );
      await assert.rejects(
        db.query("select calculate_course_grade($1,$2,$3,'Intrusion',true)", [
          ids.a,
          ids.offering,
          ids.student,
        ]),
        /access denied/,
      );
      await as(ids.faculty);
      await db.query(
        "select calculate_course_grade($1,$2,$3,'Good progress',true)",
        [ids.a, ids.offering, ids.student],
      );
      await as(ids.student);
      assert.equal(
        Number(
          (
            await db.query<{ percentage: string }>(
              "select percentage from course_grades",
            )
          ).rows[0].percentage,
        ),
        86,
      );
      await as(ids.second);
      assert.equal(
        (await db.query("select * from course_grades")).rows.length,
        0,
      );
      assert.equal((await db.query("select * from attendance")).rows.length, 0);
      await as(ids.other);
      for (const table of [
        "course_grades",
        "attendance",
        "calendar_events",
        "grade_categories",
        "grade_items",
      ])
        assert.equal(
          (await db.query(`select * from ${table}`)).rows.length,
          0,
          table,
        );
      await assert.rejects(
        db.query(
          "insert into attendance(institution_id,offering_id,user_id,session_date,status) values($1,$2,$3,'2026-10-28','absent')",
          [ids.a, ids.offering, ids.student],
        ),
        /row-level security/,
      );
    },
  );
  await t.test(
    "Expired registration and assignment deadlines enforced",
    async () => {
      await db.exec("reset role");
      await db.exec(
        `update registration_windows set opens_at=now()-interval '3 days',closes_at=now()-interval '2 days',withdrawal_closes_at=now()-interval '1 day'; update assignments set due_at=now()-interval '1 second';`,
      );
      await as(ids.student);
      await assert.rejects(
        db.query(`select register_course($1,$2,true)`, [ids.a, ids.offering]),
        /window is closed/,
      );
      await assert.rejects(
        db.query(`select submit_assignment($1,$2,'Late',true)`, [
          ids.a,
          ids.assignment,
        ]),
        /Deadline passed/,
      );
    },
  );
  await db.close();
});
