-- Dedicated Campus database only. Never apply to Workspace.
create schema if not exists campus_private;
revoke all on schema campus_private from public;
grant usage on schema campus_private to authenticated;
create type public.campus_role as enum ('student','faculty','admin');
create table public.institutions (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200),
 slug text not null unique check(slug ~ '^[a-z0-9-]+$'), credit_system text not null default 'ECTS',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 user_id uuid not null references auth.users(id), role public.campus_role not null, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(institution_id,user_id), unique(institution_id,id)
);
create function campus_private.has_role(tenant uuid, roles public.campus_role[] default array['student','faculty','admin']::public.campus_role[])
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.memberships where institution_id=tenant and user_id=(select auth.uid()) and active and role=any(roles));
$$;
create table public.departments (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 name text not null, code text not null, unique(institution_id,code),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id)
);
create table public.academic_terms (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 name text not null, starts_on date not null, ends_on date not null, check(ends_on>=starts_on),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id)
);
create table public.programs (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 department_id uuid not null, name text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,department_id) references public.departments(institution_id,id)
);
create table public.courses (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 department_id uuid not null, code text not null, title text not null, description text not null default '', credits numeric(6,2) not null check(credits>0), unique(institution_id,code),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,department_id) references public.departments(institution_id,id)
);
create table public.offerings (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 course_id uuid not null, term_id uuid not null, section text not null default 'A', capacity integer not null check(capacity>0), waitlist_enabled boolean not null default false, syllabus text not null default '', published boolean not null default false, unique(institution_id,course_id,term_id,section),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,course_id) references public.courses(institution_id,id),
 foreign key(institution_id,term_id) references public.academic_terms(institution_id,id)
);
create table public.faculty_assignments (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, user_id uuid not null references auth.users(id), unique(institution_id,offering_id,user_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.registration_windows (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 term_id uuid not null, opens_at timestamptz not null, closes_at timestamptz not null, withdrawal_closes_at timestamptz not null, check(closes_at>opens_at), check(withdrawal_closes_at>=closes_at),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,term_id) references public.academic_terms(institution_id,id)
);
create table public.prerequisites (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 course_id uuid not null, prerequisite_id uuid not null, check(course_id<>prerequisite_id), unique(institution_id,course_id,prerequisite_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,course_id) references public.courses(institution_id,id),
 foreign key(institution_id,prerequisite_id) references public.courses(institution_id,id)
);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, user_id uuid not null references auth.users(id), status text not null check(status in ('enrolled','waitlisted','withdrawn','completed')), passed boolean not null default false, unique(institution_id,offering_id,user_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.modules (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, title text not null, description text not null default '', position integer not null default 0, published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.materials (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, module_id uuid, title text not null, object_path text, external_url text, published boolean not null default false, check(object_path is not null or external_url is not null), check(external_url is null or external_url like 'https://%'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id),
 foreign key(institution_id,module_id) references public.modules(institution_id,id)
);
create table public.announcements (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid, title text not null, body text not null, published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, title text not null, instructions text not null default '', due_at timestamptz not null, max_points numeric not null check(max_points>0), max_submissions integer not null default 1 check(max_submissions between 1 and 20), published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 assignment_id uuid not null, user_id uuid not null references auth.users(id), body text not null default '', object_path text, status text not null default 'draft' check(status in ('draft','submitted')), submitted_at timestamptz, revision integer not null default 0, unique(institution_id,assignment_id,user_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,assignment_id) references public.assignments(institution_id,id)
);
create table public.grades (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 submission_id uuid not null, points numeric not null check(points>=0), feedback text not null default '', published boolean not null default false, unique(institution_id,submission_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,submission_id) references public.submissions(institution_id,id)
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, title text not null, kind text not null check(kind in ('quiz','exam')), opens_at timestamptz not null, closes_at timestamptz not null, time_limit_minutes integer check(time_limit_minutes>0), attempt_limit integer not null default 1 check(attempt_limit>0), randomized boolean not null default false, published boolean not null default false, results_published boolean not null default false, check(closes_at>opens_at),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.questions (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 assessment_id uuid not null, prompt text not null, kind text not null check(kind in ('single','multiple','boolean','short','essay')), points numeric not null check(points>0), position integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,assessment_id) references public.assessments(institution_id,id)
);
create table public.answer_options (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 question_id uuid not null, body text not null, position integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,question_id) references public.questions(institution_id,id)
);
create table public.answer_keys (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 question_id uuid not null, option_id uuid, expected_answer text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,question_id) references public.questions(institution_id,id),
 foreign key(institution_id,option_id) references public.answer_options(institution_id,id)
);
create table public.assessment_attempts (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 assessment_id uuid not null, user_id uuid not null references auth.users(id), started_at timestamptz not null default now(), expires_at timestamptz not null, finished_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,assessment_id) references public.assessments(institution_id,id)
);
create table public.assessment_responses (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 attempt_id uuid not null, question_id uuid not null, response text, unique(institution_id,attempt_id,question_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,attempt_id) references public.assessment_attempts(institution_id,id),
 foreign key(institution_id,question_id) references public.questions(institution_id,id)
);
create table public.grade_categories (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, name text not null, weight numeric not null check(weight between 0 and 1),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.grade_items (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 category_id uuid not null, assignment_id uuid, assessment_id uuid, title text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,category_id) references public.grade_categories(institution_id,id),
 foreign key(institution_id,assignment_id) references public.assignments(institution_id,id),
 foreign key(institution_id,assessment_id) references public.assessments(institution_id,id)
);
create table public.attendance (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid not null, user_id uuid not null references auth.users(id), session_date date not null, status text not null check(status in ('present','absent','excused','late')), unique(institution_id,offering_id,user_id,session_date),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.calendar_events (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 offering_id uuid, title text not null, starts_at timestamptz not null, ends_at timestamptz not null, check(ends_at>=starts_at),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id)
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 actor_id uuid references auth.users(id), operation text not null, entity text not null, record_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(institution_id,id)
);
create function campus_private.teaches(tenant uuid, offering uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.faculty_assignments f join public.memberships m on m.institution_id=f.institution_id and m.user_id=f.user_id where f.institution_id=tenant and f.offering_id=offering and f.user_id=(select auth.uid()) and m.active and m.role='faculty');
$$;
create function campus_private.enrolled(tenant uuid, offering uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and campus_private.has_role(tenant) and exists(select 1 from public.enrollments where institution_id=tenant and offering_id=offering and user_id=(select auth.uid()) and status in ('enrolled','completed'));
$$;
create function campus_private.can_teach(tenant uuid, offering uuid)
returns boolean language sql stable set search_path='' as $$ select campus_private.has_role(tenant,array['admin']::public.campus_role[]) or campus_private.teaches(tenant,offering); $$;
create function campus_private.can_learn(tenant uuid, offering uuid)
returns boolean language sql stable set search_path='' as $$ select campus_private.can_teach(tenant,offering) or campus_private.enrolled(tenant,offering); $$;
alter table public.institutions enable row level security;
alter table public.memberships enable row level security;
create policy institution_read on public.institutions for select to authenticated using(campus_private.has_role(id));
create policy institution_update on public.institutions for update to authenticated using(campus_private.has_role(id,array['admin']::public.campus_role[])) with check(campus_private.has_role(id,array['admin']::public.campus_role[]));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()) or campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
-- Membership writes deliberately have no policies. Use audited administrative RPC.
alter table public.departments enable row level security;
create index departments_tenant_idx on public.departments(institution_id);
alter table public.academic_terms enable row level security;
create index academic_terms_tenant_idx on public.academic_terms(institution_id);
alter table public.programs enable row level security;
create index programs_tenant_idx on public.programs(institution_id);
alter table public.courses enable row level security;
create index courses_tenant_idx on public.courses(institution_id);
alter table public.offerings enable row level security;
create index offerings_tenant_idx on public.offerings(institution_id);
alter table public.faculty_assignments enable row level security;
create index faculty_assignments_tenant_idx on public.faculty_assignments(institution_id);
alter table public.registration_windows enable row level security;
create index registration_windows_tenant_idx on public.registration_windows(institution_id);
alter table public.prerequisites enable row level security;
create index prerequisites_tenant_idx on public.prerequisites(institution_id);
alter table public.enrollments enable row level security;
create index enrollments_tenant_idx on public.enrollments(institution_id);
alter table public.modules enable row level security;
create index modules_tenant_idx on public.modules(institution_id);
alter table public.materials enable row level security;
create index materials_tenant_idx on public.materials(institution_id);
alter table public.announcements enable row level security;
create index announcements_tenant_idx on public.announcements(institution_id);
alter table public.assignments enable row level security;
create index assignments_tenant_idx on public.assignments(institution_id);
alter table public.submissions enable row level security;
create index submissions_tenant_idx on public.submissions(institution_id);
alter table public.grades enable row level security;
create index grades_tenant_idx on public.grades(institution_id);
alter table public.assessments enable row level security;
create index assessments_tenant_idx on public.assessments(institution_id);
alter table public.questions enable row level security;
create index questions_tenant_idx on public.questions(institution_id);
alter table public.answer_options enable row level security;
create index answer_options_tenant_idx on public.answer_options(institution_id);
alter table public.answer_keys enable row level security;
create index answer_keys_tenant_idx on public.answer_keys(institution_id);
alter table public.assessment_attempts enable row level security;
create index assessment_attempts_tenant_idx on public.assessment_attempts(institution_id);
alter table public.assessment_responses enable row level security;
create index assessment_responses_tenant_idx on public.assessment_responses(institution_id);
alter table public.grade_categories enable row level security;
create index grade_categories_tenant_idx on public.grade_categories(institution_id);
alter table public.grade_items enable row level security;
create index grade_items_tenant_idx on public.grade_items(institution_id);
alter table public.attendance enable row level security;
create index attendance_tenant_idx on public.attendance(institution_id);
alter table public.calendar_events enable row level security;
create index calendar_events_tenant_idx on public.calendar_events(institution_id);
alter table public.audit_logs enable row level security;
create index audit_logs_tenant_idx on public.audit_logs(institution_id);
create policy member_read on public.departments for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.departments for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy member_read on public.academic_terms for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.academic_terms for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy member_read on public.programs for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.programs for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy member_read on public.courses for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.courses for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy member_read on public.registration_windows for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.registration_windows for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy member_read on public.prerequisites for select to authenticated using(campus_private.has_role(institution_id));
create policy admin_write on public.prerequisites for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy offering_read on public.offerings for select to authenticated using((published and campus_private.has_role(institution_id)) or campus_private.can_teach(institution_id,id));
create policy offering_admin on public.offerings for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy faculty_read on public.faculty_assignments for select to authenticated using(campus_private.has_role(institution_id));
create policy faculty_admin on public.faculty_assignments for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[])) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy enrollment_read on public.enrollments for select to authenticated using((user_id=(select auth.uid()) and campus_private.has_role(institution_id)) or campus_private.can_teach(institution_id,offering_id));
create policy delivery_read on public.modules for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (published and campus_private.enrolled(institution_id,offering_id)));
create policy delivery_write on public.modules for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy delivery_read on public.materials for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (published and campus_private.enrolled(institution_id,offering_id)));
create policy delivery_write on public.materials for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy delivery_read on public.assignments for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (published and campus_private.enrolled(institution_id,offering_id)));
create policy delivery_write on public.assignments for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy announcement_read on public.announcements for select to authenticated using((offering_id is not null and campus_private.can_teach(institution_id,offering_id)) or (published and ((offering_id is null and campus_private.has_role(institution_id)) or campus_private.enrolled(institution_id,offering_id))) or campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create policy announcement_write on public.announcements for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy submission_read on public.submissions for select to authenticated using((user_id=(select auth.uid()) and campus_private.has_role(institution_id)) or exists(select 1 from public.assignments a where a.id=assignment_id and a.institution_id=submissions.institution_id and campus_private.can_teach(a.institution_id,a.offering_id)));
create policy grade_read on public.grades for select to authenticated using(exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id and a.institution_id=s.institution_id where s.id=submission_id and s.institution_id=grades.institution_id and (campus_private.can_teach(a.institution_id,a.offering_id) or (grades.published and s.user_id=(select auth.uid()) and campus_private.has_role(s.institution_id)))));
create policy audit_read on public.audit_logs for select to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[]));
create index enrollments_capacity_idx on public.enrollments(institution_id,offering_id,status);
create index memberships_user_idx on public.memberships(user_id,institution_id) where active;
create index faculty_user_idx on public.faculty_assignments(user_id,institution_id,offering_id);
create index submissions_assignment_idx on public.submissions(institution_id,assignment_id);
create function campus_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then return coalesce(new,old); end if;
 insert into public.audit_logs(institution_id,actor_id,operation,entity,record_id) values(coalesce(new.institution_id,old.institution_id),auth.uid(),tg_op,tg_table_name,coalesce(new.id,old.id));
 return coalesce(new,old);
end; $$;
create trigger audit after insert or update or delete on public.departments for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.academic_terms for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.programs for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.courses for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.offerings for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.faculty_assignments for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.registration_windows for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.prerequisites for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.enrollments for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.modules for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.materials for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.announcements for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.assignments for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.submissions for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.grades for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.assessments for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.questions for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.answer_options for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.answer_keys for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.assessment_attempts for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.assessment_responses for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.grade_categories for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.grade_items for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.attendance for each row execute function campus_private.audit_change();
create trigger audit after insert or update or delete on public.calendar_events for each row execute function campus_private.audit_change();
-- Revoke implicit function execution before granting the narrow surface below.
revoke execute on all functions in schema campus_private from public, anon;
grant execute on function campus_private.has_role(uuid,public.campus_role[]), campus_private.teaches(uuid,uuid), campus_private.enrolled(uuid,uuid), campus_private.can_teach(uuid,uuid), campus_private.can_learn(uuid,uuid) to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
