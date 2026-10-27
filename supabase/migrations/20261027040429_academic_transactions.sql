create function campus_private.register(tenant uuid, offering uuid, withdraw boolean default false)
returns text language plpgsql security definer set search_path='' as $$
declare o public.offerings; w public.registration_windows; current_status text; result text;
begin
 if auth.uid() is null or not campus_private.has_role(tenant,array['student']::public.campus_role[]) then raise exception 'Student membership required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text||auth.uid()::text,0));
 select * into o from public.offerings where institution_id=tenant and id=offering for update;
 if o.id is null or not o.published then raise exception 'Offering unavailable'; end if;
 select * into w from public.registration_windows where institution_id=tenant and term_id=o.term_id and opens_at<=now() and (case when withdraw then withdrawal_closes_at else closes_at end)>=now() order by opens_at desc limit 1;
 if w.id is null then raise exception 'Registration window is closed'; end if;
 select status into current_status from public.enrollments where institution_id=tenant and offering_id=offering and user_id=auth.uid();
 if withdraw then
  if current_status not in ('enrolled','waitlisted') or current_status is null then raise exception 'No active registration'; end if;
  update public.enrollments set status='withdrawn',updated_at=now() where institution_id=tenant and offering_id=offering and user_id=auth.uid();
  -- Promote the earliest waitlisted student while holding the offering lock.
  if current_status='enrolled' then
   update public.enrollments set status='enrolled',updated_at=now() where id=(select e.id from public.enrollments e join public.memberships m on m.institution_id=e.institution_id and m.user_id=e.user_id and m.active and m.role='student' where e.institution_id=tenant and e.offering_id=offering and e.status='waitlisted' order by e.created_at,e.id limit 1);
  end if;
  return 'withdrawn';
 end if;
 if current_status in ('enrolled','waitlisted','completed') then raise exception 'Already registered'; end if;
 if exists(select 1 from public.prerequisites p where p.institution_id=tenant and p.course_id=o.course_id and not exists(select 1 from public.enrollments e join public.offerings x on x.id=e.offering_id and x.institution_id=e.institution_id where e.institution_id=tenant and e.user_id=auth.uid() and e.status='completed' and e.passed and x.course_id=p.prerequisite_id)) then raise exception 'Prerequisites not met'; end if;
 if exists(select 1 from public.enrollments e join public.offerings x on x.id=e.offering_id and x.institution_id=e.institution_id where e.institution_id=tenant and e.user_id=auth.uid() and e.status in ('enrolled','waitlisted') and x.course_id=o.course_id and x.term_id=o.term_id) then raise exception 'Already registered for this course in this term'; end if;
 if (select count(*) from public.enrollments where institution_id=tenant and offering_id=offering and status='enrolled')>=o.capacity then
  if not o.waitlist_enabled then raise exception 'Course is full'; end if;
  result='waitlisted';
 else result='enrolled'; end if;
 insert into public.enrollments(institution_id,offering_id,user_id,status) values(tenant,offering,auth.uid(),result)
 on conflict(institution_id,offering_id,user_id) do update set status=excluded.status,created_at=now(),updated_at=now();
 return result;
end; $$;
create function public.register_course(tenant uuid, offering uuid, withdraw boolean default false)
returns text language sql security invoker set search_path='' as $$ select campus_private.register(tenant,offering,withdraw); $$;

create function campus_private.submit(tenant uuid, assignment uuid, body_text text, finalize boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.assignments; s public.submissions; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(body_text)>100000 then raise exception 'Response too long'; end if;
 select * into a from public.assignments where institution_id=tenant and id=assignment for share;
 if a.id is null or not a.published or not campus_private.enrolled(tenant,a.offering_id) or not campus_private.has_role(tenant,array['student']::public.campus_role[]) then raise exception 'Assignment unavailable'; end if;
 if now()>a.due_at then raise exception 'Deadline passed'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||assignment::text,0));
 select * into s from public.submissions where institution_id=tenant and assignment_id=assignment and user_id=auth.uid() for update;
 if s.revision>=a.max_submissions then raise exception 'Submission limit reached'; end if;
 if finalize and length(trim(body_text))=0 then raise exception 'Response required'; end if;
 insert into public.submissions(institution_id,assignment_id,user_id,body,status,submitted_at,revision)
 values(tenant,assignment,auth.uid(),body_text,case when finalize then 'submitted' else 'draft' end,case when finalize then now() else null end,case when finalize then 1 else 0 end)
 on conflict(institution_id,assignment_id,user_id) do update set body=excluded.body,status=excluded.status,submitted_at=excluded.submitted_at,revision=public.submissions.revision+excluded.revision,updated_at=now() returning id into result;
 -- Any replacement invalidates a previously published grade.
 delete from public.grades where institution_id=tenant and submission_id=result;
 return result;
end; $$;
create function public.submit_assignment(tenant uuid, assignment uuid, body_text text, finalize boolean default false)
returns uuid language sql security invoker set search_path='' as $$ select campus_private.submit(tenant,assignment,body_text,finalize); $$;

create function campus_private.grade(tenant uuid, submission uuid, score numeric, comments text, publish boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.assignments; s public.submissions; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into s from public.submissions where institution_id=tenant and id=submission for update;
 select * into a from public.assignments where institution_id=tenant and id=s.assignment_id;
 if s.id is null or not campus_private.can_teach(tenant,a.offering_id) then raise exception 'Grading not authorized'; end if;
 if s.status<>'submitted' then raise exception 'Submission is a draft'; end if;
 if score is null or score<0 or score>a.max_points or length(comments)>10000 then raise exception 'Invalid grade'; end if;
 insert into public.grades(institution_id,submission_id,points,feedback,published) values(tenant,submission,score,comments,publish)
 on conflict(institution_id,submission_id) do update set points=excluded.points,feedback=excluded.feedback,published=excluded.published,updated_at=now() returning id into result;
 return result;
end; $$;
create function public.grade_submission(tenant uuid, submission uuid, score numeric, comments text, publish boolean default false)
returns uuid language sql security invoker set search_path='' as $$ select campus_private.grade(tenant,submission,score,comments,publish); $$;

create function campus_private.set_membership(tenant uuid, member uuid, new_role public.campus_role, enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not campus_private.has_role(tenant,array['admin']::public.campus_role[]) then raise exception 'Administrator required'; end if;
 if member=auth.uid() then raise exception 'Cannot change your own membership'; end if;
 insert into public.memberships(institution_id,user_id,role,active) values(tenant,member,new_role,enabled)
 on conflict(institution_id,user_id) do update set role=excluded.role,active=excluded.active,updated_at=now();
end; $$;
create function public.set_membership(tenant uuid, member uuid, new_role public.campus_role, enabled boolean default true)
returns void language sql security invoker set search_path='' as $$ select campus_private.set_membership(tenant,member,new_role,enabled); $$;
create trigger membership_audit after insert or update or delete on public.memberships for each row execute function campus_private.audit_change();
revoke execute on all functions in schema campus_private from public,anon;
revoke execute on function public.register_course(uuid,uuid,boolean),public.submit_assignment(uuid,uuid,text,boolean),public.grade_submission(uuid,uuid,numeric,text,boolean),public.set_membership(uuid,uuid,public.campus_role,boolean) from public,anon;
grant execute on function campus_private.register(uuid,uuid,boolean),campus_private.submit(uuid,uuid,text,boolean),campus_private.grade(uuid,uuid,numeric,text,boolean),campus_private.set_membership(uuid,uuid,public.campus_role,boolean),public.register_course(uuid,uuid,boolean),public.submit_assignment(uuid,uuid,text,boolean),public.grade_submission(uuid,uuid,numeric,text,boolean),public.set_membership(uuid,uuid,public.campus_role,boolean) to authenticated;
