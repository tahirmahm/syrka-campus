import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("Course sessions enforce enrollment, tenant identity, publication and revocation", async () => {
  const db = new PGlite();
  const ids = Array.from(
    { length: 10 },
    (_, i) => `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  );
  const [
    faculty,
    student,
    outsider,
    tenant,
    foreign,
    dept,
    term,
    course,
    offering,
  ] = ids;
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,encrypted_password text,email_change text);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid()to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert on storage.objects to authenticated;`,
  );
  for (const f of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec(
    `insert into auth.users(id)values('${faculty}'),('${student}'),('${outsider}');insert into institutions(id,name,slug)values('${tenant}','Campus A','session-a'),('${foreign}','Campus B','session-b');insert into memberships(institution_id,user_id,role)values('${tenant}','${faculty}','faculty'),('${tenant}','${student}','student'),('${foreign}','${outsider}','admin');insert into departments(id,institution_id,name,code)values('${dept}','${tenant}','Economics','ECO');insert into academic_terms(id,institution_id,name,starts_on,ends_on)values('${term}','${tenant}','Term','2026-01-01','2027-01-01');insert into courses(id,institution_id,department_id,code,title,credits)values('${course}','${tenant}','${dept}','ECO1','Economic models',6);insert into offerings(id,institution_id,course_id,term_id,capacity,published)values('${offering}','${tenant}','${course}','${term}',10,true);insert into faculty_assignments(institution_id,offering_id,user_id)values('${tenant}','${offering}','${faculty}');insert into enrollments(institution_id,offering_id,user_id,status)values('${tenant}','${offering}','${student}','enrolled');`,
  );
  const as = async (id: string) =>
    db.exec(
      `reset role;set request.jwt.claim.sub='${id}';set role authenticated;`,
    );
  await as(faculty);
  const room = (
    await db.query<{ id: string }>(
      `insert into session_rooms(owner_id,title,institution_id,offering_id,kind)values('${faculty}','Lecture','${tenant}','${offering}','lecture')returning id`,
    )
  ).rows[0].id;
  await db.exec(
    `insert into session_segments(room_id,speaker_name,start_ms,end_ms,original_text)values('${room}','Unknown imported',0,1000,'Course evidence');insert into session_notes(room_id,body)values('${room}','{}');`,
  );
  await as(student);
  assert.equal((await db.query(`select * from session_rooms`)).rows.length, 1);
  assert.equal((await db.query(`select * from session_notes`)).rows.length, 0);
  await assert.rejects(
    db.query(
      `insert into session_rooms(owner_id,title,institution_id,offering_id)values('${student}','Unauthorized','${tenant}','${offering}')`,
    ),
  );
  await db.query(`select session_request_join('${room}','Student')`);
  await as(faculty);
  await db.exec(
    `update session_members set status='approved'where user_id='${student}';update session_notes set published=true;update session_rooms set transcript_published=true;`,
  );
  await as(student);
  assert.equal((await db.query(`select * from session_notes`)).rows.length, 1);
  assert.equal(
    (await db.query(`select * from session_segments`)).rows.length,
    1,
  );
  assert.equal(
    (await db.query(`update session_notes set body='{}'returning room_id`)).rows
      .length,
    0,
  );
  await as(outsider);
  assert.equal((await db.query(`select * from session_rooms`)).rows.length, 0);
  assert.equal((await db.query(`select * from session_notes`)).rows.length, 0);
  await assert.rejects(
    db.query(`select session_request_join('${room}','Foreign admin')`),
  );
  await db.exec("reset role");
  await db.exec(
    `update enrollments set status='withdrawn'where user_id='${student}';`,
  );
  await as(student);
  assert.equal((await db.query(`select * from session_rooms`)).rows.length, 0);
  assert.equal(
    (await db.query(`select * from session_segments`)).rows.length,
    0,
  );
  await db.exec("reset role");
  await db.exec(
    `update memberships set active=false where user_id='${faculty}';`,
  );
  await as(faculty);
  assert.equal((await db.query(`select * from session_rooms`)).rows.length, 0);
  assert.equal((await db.query(`select * from session_notes`)).rows.length, 0);
  await db.close();
});
