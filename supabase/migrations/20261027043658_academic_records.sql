-- Attendance and calendars use the same institutional and course boundaries.
alter table public.attendance add foreign key(institution_id,user_id) references public.memberships(institution_id,user_id);
create policy attendance_read on public.attendance for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (user_id=(select auth.uid()) and campus_private.has_role(institution_id)));
create policy attendance_write on public.attendance for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id) and exists(select 1 from public.enrollments e where e.institution_id=attendance.institution_id and e.offering_id=attendance.offering_id and e.user_id=attendance.user_id and e.status in ('enrolled','completed')));
create policy event_read on public.calendar_events for select to authenticated using((offering_id is null and campus_private.has_role(institution_id)) or campus_private.can_learn(institution_id,offering_id));
create policy event_write on public.calendar_events for all to authenticated using(campus_private.has_role(institution_id,array['admin']::public.campus_role[]) or (offering_id is not null and campus_private.teaches(institution_id,offering_id))) with check(campus_private.has_role(institution_id,array['admin']::public.campus_role[]) or (offering_id is not null and campus_private.teaches(institution_id,offering_id)));
create policy category_read on public.grade_categories for select to authenticated using(campus_private.can_learn(institution_id,offering_id));
create policy category_write on public.grade_categories for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy item_read on public.grade_items for select to authenticated using(exists(select 1 from public.grade_categories c where c.institution_id=grade_items.institution_id and c.id=category_id));
create policy item_write on public.grade_items for all to authenticated using(exists(select 1 from public.grade_categories c where c.institution_id=grade_items.institution_id and c.id=category_id and campus_private.can_teach(c.institution_id,c.offering_id))) with check(exists(select 1 from public.grade_categories c where c.institution_id=grade_items.institution_id and c.id=category_id and campus_private.can_teach(c.institution_id,c.offering_id)));
alter table public.grade_items add check(num_nonnulls(assignment_id,assessment_id)=1);
create function campus_private.validate_grade_item() returns trigger language plpgsql security definer set search_path='' as $$
declare offering uuid; source_offering uuid;
begin
 select offering_id into offering from public.grade_categories where institution_id=new.institution_id and id=new.category_id;
 if new.assignment_id is not null then select offering_id into source_offering from public.assignments where institution_id=new.institution_id and id=new.assignment_id;
 else select offering_id into source_offering from public.assessments where institution_id=new.institution_id and id=new.assessment_id; end if;
 if offering is distinct from source_offering then raise exception 'Grade item must belong to its category course'; end if;
 return new;
end; $$;
create trigger validate_grade_item before insert or update on public.grade_items for each row execute function campus_private.validate_grade_item();
create table public.course_grades (
 id uuid primary key default gen_random_uuid(),institution_id uuid not null references public.institutions(id),offering_id uuid not null,user_id uuid not null,percentage numeric not null check(percentage between 0 and 100),feedback text not null default '',published boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(institution_id,offering_id,user_id),
 foreign key(institution_id,offering_id) references public.offerings(institution_id,id),foreign key(institution_id,user_id) references public.memberships(institution_id,user_id)
);
alter table public.course_grades enable row level security;
grant select on public.course_grades to authenticated;
create index course_grades_user_idx on public.course_grades(institution_id,user_id);
create policy course_grade_read on public.course_grades for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (published and user_id=(select auth.uid()) and campus_private.has_role(institution_id)));
create trigger audit after insert or update or delete on public.course_grades for each row execute function campus_private.audit_change();
create function campus_private.calculate_course_grade(tenant uuid, offering uuid, student uuid, comments text, publish boolean)
returns numeric language plpgsql security definer set search_path='' as $$
declare category public.grade_categories; item public.grade_items; category_score numeric; item_count int; earned numeric; maximum numeric; total numeric:=0; weights numeric;
begin
 if auth.uid() is null or not campus_private.can_teach(tenant,offering) then raise exception 'Grading access denied'; end if;
 perform 1 from public.offerings where institution_id=tenant and id=offering for update;
 if not exists(select 1 from public.enrollments where institution_id=tenant and offering_id=offering and user_id=student and status in ('enrolled','completed')) then raise exception 'Student is not enrolled'; end if;
 select sum(weight) into weights from public.grade_categories where institution_id=tenant and offering_id=offering;
 if weights is distinct from 1::numeric then raise exception 'Category weights must total 100 percent'; end if;
 for category in select * from public.grade_categories where institution_id=tenant and offering_id=offering loop
  category_score:=0;item_count:=0;
  for item in select * from public.grade_items where institution_id=tenant and category_id=category.id loop
   item_count:=item_count+1;earned:=null;maximum:=null;
   if item.assignment_id is not null then
    select g.points,a.max_points into earned,maximum from public.grades g join public.submissions s on s.id=g.submission_id and s.institution_id=g.institution_id join public.assignments a on a.id=s.assignment_id and a.institution_id=s.institution_id where g.institution_id=tenant and s.user_id=student and a.id=item.assignment_id;
   else
    -- Highest fully marked submitted attempt counts for quizzes and exams.
    select sum(r.points),sum(q.max_points) into earned,maximum from public.assessment_attempts a join public.attempt_questions q on q.attempt_id=a.id and q.institution_id=a.institution_id left join public.assessment_responses r on r.institution_id=q.institution_id and r.attempt_id=q.attempt_id and r.question_id=q.question_id where a.institution_id=tenant and a.assessment_id=item.assessment_id and a.user_id=student and a.finished_at is not null group by a.id having count(r.points)=count(q.id) order by sum(r.points)/sum(q.max_points) desc limit 1;
   end if;
   if earned is null or maximum is null or maximum<=0 then raise exception 'All grade items require a fully marked submission'; end if;
   category_score:=category_score+earned/maximum;
  end loop;
  if item_count=0 then raise exception 'Each category requires a grade item'; end if;
  total:=total+(category_score/item_count)*category.weight*100;
 end loop;
 insert into public.course_grades(institution_id,offering_id,user_id,percentage,feedback,published) values(tenant,offering,student,round(total,2),comments,publish) on conflict(institution_id,offering_id,user_id) do update set percentage=excluded.percentage,feedback=excluded.feedback,published=excluded.published,updated_at=now();
 return round(total,2);
end; $$;
create function public.calculate_course_grade(tenant uuid, offering uuid, student uuid, comments text default '', publish boolean default false) returns numeric language sql security invoker set search_path='' as $$ select campus_private.calculate_course_grade(tenant,offering,student,comments,publish); $$;
revoke execute on all functions in schema campus_private from public,anon;
revoke execute on function public.calculate_course_grade(uuid,uuid,uuid,text,boolean) from public,anon;
grant execute on function public.calculate_course_grade(uuid,uuid,uuid,text,boolean),campus_private.calculate_course_grade(uuid,uuid,uuid,text,boolean) to authenticated;
create unique index grade_item_assignment_unique on public.grade_items(institution_id,category_id,assignment_id) where assignment_id is not null;
create unique index grade_item_assessment_unique on public.grade_items(institution_id,category_id,assessment_id) where assessment_id is not null;
create function campus_private.lock_grade_structure() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if tg_table_name='grade_categories' then
  target:=coalesce(new.offering_id,old.offering_id);
 else
  select offering_id into target from public.grade_categories where institution_id=coalesce(new.institution_id,old.institution_id) and id=coalesce(new.category_id,old.category_id);
 end if;
 perform 1 from public.offerings where institution_id=coalesce(new.institution_id,old.institution_id) and id=target for update;
 return coalesce(new,old);
end; $$;
create trigger lock_grade_structure before insert or update or delete on public.grade_categories for each row execute function campus_private.lock_grade_structure();
create trigger lock_grade_structure before insert or update or delete on public.grade_items for each row execute function campus_private.lock_grade_structure();
revoke execute on function campus_private.lock_grade_structure() from public,anon;
