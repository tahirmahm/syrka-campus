-- Composite keys enforce consistency beyond the tenant boundary.
alter table public.modules add unique(institution_id,offering_id,id);
alter table public.materials add constraint material_module_offering_fk foreign key(institution_id,offering_id,module_id) references public.modules(institution_id,offering_id,id);
create function campus_private.validate_faculty() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.memberships where institution_id=new.institution_id and user_id=new.user_id and role='faculty' and active) then raise exception 'Active institutional faculty membership required'; end if;
 return new;
end; $$;
create trigger validate_faculty before insert or update on public.faculty_assignments for each row execute function campus_private.validate_faculty();
create function campus_private.touch_updated() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename<>'audit_logs' loop
  execute format('create trigger touch_updated before update on public.%I for each row execute function campus_private.touch_updated()',t);
 end loop;
end; $$;
revoke execute on all functions in schema campus_private from public,anon;
