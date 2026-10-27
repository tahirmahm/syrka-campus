-- Assessment answers are never exposed through direct student table access.
alter table public.assessment_responses add column points numeric check(points>=0), add column feedback text not null default '';
create table public.attempt_questions (
 id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id),
 attempt_id uuid not null, question_id uuid not null, position integer not null,
 prompt text not null, kind text not null, max_points numeric not null check(max_points>0),
 options jsonb not null default '[]', marking_key jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(institution_id,attempt_id,question_id),
 foreign key(institution_id,attempt_id) references public.assessment_attempts(institution_id,id),
 foreign key(institution_id,question_id) references public.questions(institution_id,id)
);
alter table public.attempt_questions enable row level security;
revoke all on public.attempt_questions from anon,authenticated;
create index attempt_questions_attempt_idx on public.attempt_questions(institution_id,attempt_id);
create index assessment_attempts_user_idx on public.assessment_attempts(institution_id,assessment_id,user_id);
create policy assessment_read on public.assessments for select to authenticated using(campus_private.can_teach(institution_id,offering_id) or (published and campus_private.enrolled(institution_id,offering_id)));
create policy assessment_write on public.assessments for all to authenticated using(campus_private.can_teach(institution_id,offering_id)) with check(campus_private.can_teach(institution_id,offering_id));
create policy question_staff on public.questions for select to authenticated using(exists(select 1 from public.assessments a where a.institution_id=questions.institution_id and a.id=assessment_id and campus_private.can_teach(a.institution_id,a.offering_id)));
create policy option_staff on public.answer_options for select to authenticated using(exists(select 1 from public.questions q where q.institution_id=answer_options.institution_id and q.id=question_id));
create policy key_staff on public.answer_keys for select to authenticated using(exists(select 1 from public.questions q where q.institution_id=answer_keys.institution_id and q.id=question_id));
create policy attempt_staff on public.assessment_attempts for select to authenticated using(exists(select 1 from public.assessments a where a.institution_id=assessment_attempts.institution_id and a.id=assessment_id and campus_private.can_teach(a.institution_id,a.offering_id)));
create policy response_staff on public.assessment_responses for select to authenticated using(exists(select 1 from public.assessment_attempts a where a.institution_id=assessment_responses.institution_id and a.id=attempt_id));

create function campus_private.author_question(tenant uuid, assessment uuid, content jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.assessments; q uuid; opt uuid; item jsonb; correct_count int:=0; option_count int:=0; k text;
begin
 select * into a from public.assessments where institution_id=tenant and id=assessment for update;
 if auth.uid() is null or a.id is null or not campus_private.can_teach(tenant,a.offering_id) then raise exception 'Teaching access required'; end if;
 if length(content::text)>100000 then raise exception 'Question too large'; end if;
 k:=content->>'kind';
 if k is null or k not in ('single','multiple','boolean','short','essay') or coalesce(length(trim(content->>'prompt')),0) not between 1 and 10000 or (content->>'points')::numeric not between 0.01 and 10000 then raise exception 'Invalid question'; end if;
 insert into public.questions(institution_id,assessment_id,prompt,kind,points,position)
 values(tenant,assessment,content->>'prompt',k,(content->>'points')::numeric,(select count(*) from public.questions where institution_id=tenant and assessment_id=assessment)) returning id into q;
 if k in ('single','multiple','boolean') then
  for item in select value from jsonb_array_elements(content->'options') loop
   option_count:=option_count+1;
   if coalesce(length(trim(item->>'body')),0) not between 1 and 2000 then raise exception 'Invalid answer option'; end if;
   insert into public.answer_options(institution_id,question_id,body,position) values(tenant,q,item->>'body',option_count) returning id into opt;
   if (item->>'correct')::boolean then
    insert into public.answer_keys(institution_id,question_id,option_id) values(tenant,q,opt);
    correct_count:=correct_count+1;
   end if;
  end loop;
  if option_count not between 2 and 20 or correct_count<1 or (k in ('single','boolean') and correct_count<>1) or (k='boolean' and option_count<>2) then raise exception 'Invalid correct answer selection'; end if;
 elsif k='short' then
  if coalesce(length(trim(content->>'expected')),0) not between 1 and 2000 then raise exception 'Expected answer required'; end if;
  insert into public.answer_keys(institution_id,question_id,expected_answer) values(tenant,q,content->>'expected');
 end if;
 return q;
end; $$;
create function public.author_question(tenant uuid, assessment uuid, content jsonb) returns uuid language sql security invoker set search_path='' as $$ select campus_private.author_question(tenant,assessment,content); $$;

create function campus_private.start_assessment(tenant uuid, assessment uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.assessments; attempt uuid; existing public.assessment_attempts;
begin
 if auth.uid() is null or not campus_private.has_role(tenant,array['student']::public.campus_role[]) then raise exception 'Student access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||assessment::text,1));
 select * into a from public.assessments where institution_id=tenant and id=assessment for share;
 if a.id is null or not a.published or not campus_private.enrolled(tenant,a.offering_id) then raise exception 'Assessment unavailable'; end if;
 if clock_timestamp()<a.opens_at or clock_timestamp()>=a.closes_at then raise exception 'Assessment window is closed'; end if;
 select * into existing from public.assessment_attempts where institution_id=tenant and assessment_id=assessment and user_id=auth.uid() and finished_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
 if existing.id is not null then return existing.id; end if;
 if (select count(*) from public.assessment_attempts where institution_id=tenant and assessment_id=assessment and user_id=auth.uid())>=a.attempt_limit then raise exception 'Attempt limit reached'; end if;
 if not exists(select 1 from public.questions where institution_id=tenant and assessment_id=assessment) then raise exception 'Assessment has no questions'; end if;
 insert into public.assessment_attempts(institution_id,assessment_id,user_id,expires_at)
 values(tenant,assessment,auth.uid(),least(a.closes_at,clock_timestamp()+make_interval(mins=>coalesce(a.time_limit_minutes,525600)))) returning id into attempt;
 insert into public.attempt_questions(institution_id,attempt_id,question_id,position,prompt,kind,max_points,options,marking_key)
 select tenant,attempt,q.id,row_number() over(order by case when a.randomized then random() else q.position::double precision end,q.id),q.prompt,q.kind,q.points,
 coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'body',o.body) order by o.position,o.id) from public.answer_options o where o.institution_id=tenant and o.question_id=q.id),'[]'::jsonb),
 jsonb_build_object('options',coalesce((select jsonb_agg(k.option_id::text order by k.option_id::text) from public.answer_keys k where k.institution_id=tenant and k.question_id=q.id and k.option_id is not null),'[]'::jsonb),'expected',(select k.expected_answer from public.answer_keys k where k.institution_id=tenant and k.question_id=q.id and k.expected_answer is not null limit 1))
 from public.questions q where q.institution_id=tenant and q.assessment_id=assessment;
 return attempt;
end; $$;
create function public.start_assessment(tenant uuid, assessment uuid) returns uuid language sql security invoker set search_path='' as $$ select campus_private.start_assessment(tenant,assessment); $$;

create function campus_private.save_attempt(tenant uuid, attempt uuid, answers jsonb, finalize boolean)
returns void language plpgsql security definer set search_path='' as $$
declare a public.assessment_attempts; q public.attempt_questions; response_value jsonb; earned numeric; selected jsonb;
begin
 select * into a from public.assessment_attempts where institution_id=tenant and id=attempt for update;
 if auth.uid() is null or a.id is null or a.user_id<>auth.uid() or not campus_private.has_role(tenant,array['student']::public.campus_role[]) or not exists(select 1 from public.assessments x where x.institution_id=tenant and x.id=a.assessment_id and campus_private.enrolled(tenant,x.offering_id)) then raise exception 'Attempt access denied'; end if;
 if a.finished_at is not null then raise exception 'Attempt already submitted'; end if;
 if clock_timestamp()>=a.expires_at then
  if not finalize then raise exception 'Attempt time expired'; end if;
  -- Expired attempts may finalize only responses saved before their deadline.
  select coalesce(jsonb_object_agg(r.question_id::text,r.response::jsonb),'{}'::jsonb) into answers from public.assessment_responses r where r.institution_id=tenant and r.attempt_id=attempt;
 end if;
 if jsonb_typeof(answers)<>'object' or length(answers::text)>1000000 then raise exception 'Invalid responses'; end if;
 if exists(select 1 from jsonb_object_keys(answers) k where not exists(select 1 from public.attempt_questions x where x.institution_id=tenant and x.attempt_id=attempt and x.question_id::text=k)) then raise exception 'Question not part of attempt'; end if;
 for q in select * from public.attempt_questions where institution_id=tenant and attempt_id=attempt loop
  response_value:=coalesce(answers->q.question_id::text,case when q.kind in ('single','multiple','boolean') then '[]'::jsonb else '""'::jsonb end);
  earned:=null;
  if q.kind in ('single','multiple','boolean') then
   if jsonb_typeof(response_value)<>'array' then raise exception 'Expected answer choices'; end if;
   if jsonb_array_length(response_value)>20 or (q.kind<>'multiple' and jsonb_array_length(response_value)>1) then raise exception 'Too many choices'; end if;
   if exists(select 1 from jsonb_array_elements_text(response_value) choice where not exists(select 1 from jsonb_array_elements(q.options) o where o->>'id'=choice)) then raise exception 'Invalid answer choice'; end if;
   select coalesce(jsonb_agg(v order by v),'[]'::jsonb) into selected from (select distinct value as v from jsonb_array_elements_text(response_value)) x;
   if finalize then earned:=case when selected=q.marking_key->'options' then q.max_points else 0 end; end if;
  else
   if jsonb_typeof(response_value)<>'string' or length(response_value #>> '{}')>100000 then raise exception 'Invalid text answer'; end if;
   if finalize and q.kind='short' then earned:=case when lower(trim(response_value #>> '{}'))=lower(trim(q.marking_key->>'expected')) then q.max_points else 0 end; end if;
  end if;
  insert into public.assessment_responses(institution_id,attempt_id,question_id,response,points)
  values(tenant,attempt,q.question_id,response_value::text,earned)
  on conflict(institution_id,attempt_id,question_id) do update set response=excluded.response,points=excluded.points,feedback='';
 end loop;
 if finalize then update public.assessment_attempts set finished_at=least(clock_timestamp(),a.expires_at) where id=attempt and institution_id=tenant; end if;
end; $$;
create function public.save_attempt(tenant uuid, attempt uuid, answers jsonb, finalize boolean default false) returns void language sql security invoker set search_path='' as $$ select campus_private.save_attempt(tenant,attempt,answers,finalize); $$;

create function campus_private.read_attempt(tenant uuid, attempt uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assessment_attempts; exam public.assessments; staff boolean; show_marks boolean;
begin
 select * into a from public.assessment_attempts where institution_id=tenant and id=attempt;
 select * into exam from public.assessments where institution_id=tenant and id=a.assessment_id;
 staff:=campus_private.can_teach(tenant,exam.offering_id);
 if auth.uid() is null or a.id is null or not (staff or (a.user_id=auth.uid() and campus_private.has_role(tenant) and campus_private.enrolled(tenant,exam.offering_id))) then raise exception 'Attempt access denied'; end if;
 show_marks:=staff or (exam.results_published and a.finished_at is not null);
 return jsonb_build_object('id',a.id,'title',exam.title,'assessment_id',exam.id,'offering_id',exam.offering_id,'user_id',a.user_id,'expires_at',a.expires_at,'finished_at',a.finished_at,'expired',clock_timestamp()>=a.expires_at,'staff',staff,'results_published',show_marks,
 'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.question_id,'prompt',q.prompt,'kind',q.kind,'max_points',q.max_points,'options',q.options,'response',r.response::jsonb,'points',case when show_marks then r.points end,'feedback',case when show_marks then r.feedback end) order by q.position)
 from public.attempt_questions q left join public.assessment_responses r on r.institution_id=q.institution_id and r.attempt_id=q.attempt_id and r.question_id=q.question_id where q.institution_id=tenant and q.attempt_id=attempt),'[]'::jsonb));
end; $$;
create function public.read_attempt(tenant uuid, attempt uuid) returns jsonb language sql security invoker set search_path='' as $$ select campus_private.read_attempt(tenant,attempt); $$;

create function campus_private.mark_response(tenant uuid, attempt uuid, question uuid, score numeric, comments text)
returns void language plpgsql security definer set search_path='' as $$
declare a public.assessment_attempts; q public.attempt_questions;
begin
 select * into a from public.assessment_attempts where institution_id=tenant and id=attempt for update;
 if auth.uid() is null or a.id is null or not exists(select 1 from public.assessments x where x.institution_id=tenant and x.id=a.assessment_id and campus_private.can_teach(tenant,x.offering_id)) then raise exception 'Grading access denied'; end if;
 if a.finished_at is null then raise exception 'Attempt not submitted'; end if;
 select * into q from public.attempt_questions where institution_id=tenant and attempt_id=attempt and question_id=question;
 if q.id is null or score is null or score<0 or score>q.max_points or length(comments)>10000 then raise exception 'Invalid grade'; end if;
 update public.assessment_responses set points=score,feedback=comments where institution_id=tenant and attempt_id=attempt and question_id=question;
end; $$;
create function public.mark_response(tenant uuid, attempt uuid, question uuid, score numeric, comments text) returns void language sql security invoker set search_path='' as $$ select campus_private.mark_response(tenant,attempt,question,score,comments); $$;

create function campus_private.my_attempts(tenant uuid, assessment uuid)
returns table(id uuid,started_at timestamptz,expires_at timestamptz,finished_at timestamptz) language sql stable security definer set search_path='' as $$
 select a.id,a.started_at,a.expires_at,a.finished_at from public.assessment_attempts a where auth.uid() is not null and campus_private.has_role(tenant) and a.institution_id=tenant and a.assessment_id=assessment and a.user_id=auth.uid() order by a.started_at;
$$;
create function public.my_attempts(tenant uuid, assessment uuid) returns table(id uuid,started_at timestamptz,expires_at timestamptz,finished_at timestamptz) language sql security invoker set search_path='' as $$ select * from campus_private.my_attempts(tenant,assessment); $$;
revoke execute on all functions in schema campus_private from public,anon;
revoke execute on function public.author_question(uuid,uuid,jsonb),public.start_assessment(uuid,uuid),public.save_attempt(uuid,uuid,jsonb,boolean),public.read_attempt(uuid,uuid),public.mark_response(uuid,uuid,uuid,numeric,text),public.my_attempts(uuid,uuid) from public,anon;
grant execute on function campus_private.author_question(uuid,uuid,jsonb),campus_private.start_assessment(uuid,uuid),campus_private.save_attempt(uuid,uuid,jsonb,boolean),campus_private.read_attempt(uuid,uuid),campus_private.mark_response(uuid,uuid,uuid,numeric,text),campus_private.my_attempts(uuid,uuid),public.author_question(uuid,uuid,jsonb),public.start_assessment(uuid,uuid),public.save_attempt(uuid,uuid,jsonb,boolean),public.read_attempt(uuid,uuid),public.mark_response(uuid,uuid,uuid,numeric,text),public.my_attempts(uuid,uuid) to authenticated;

alter table public.assessment_responses add constraint response_snapshot_fk foreign key(institution_id,attempt_id,question_id) references public.attempt_questions(institution_id,attempt_id,question_id);
alter table public.answer_options add unique(institution_id,question_id,id);
alter table public.answer_keys add constraint answer_option_question_fk foreign key(institution_id,question_id,option_id) references public.answer_options(institution_id,question_id,id);
