-- Keep the explicit read policies and avoid executing a second permissive
-- SELECT branch from each former FOR ALL writer policy.
do $$
declare p record;
begin
 for p in select * from pg_policies where schemaname='public' and cmd='ALL' loop
  if p.roles<>array['authenticated']::name[] or not exists(select 1 from pg_policies r where r.schemaname=p.schemaname and r.tablename=p.tablename and r.cmd='SELECT') then
   raise exception 'Unexpected write policy shape for %',p.tablename;
  end if;
  execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  execute format('create policy %I on %I.%I for insert to authenticated with check (%s)',p.policyname||'_insert',p.schemaname,p.tablename,p.with_check);
  execute format('create policy %I on %I.%I for update to authenticated using (%s) with check (%s)',p.policyname||'_update',p.schemaname,p.tablename,p.qual,p.with_check);
  execute format('create policy %I on %I.%I for delete to authenticated using (%s)',p.policyname||'_delete',p.schemaname,p.tablename,p.qual);
 end loop;
end; $$;
