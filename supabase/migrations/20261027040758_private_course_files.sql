insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('campus-materials','campus-materials',false,10485760,array['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation']);
create policy campus_file_insert on storage.objects for insert to authenticated with check(
 bucket_id='campus-materials' and exists(select 1 from public.offerings o where o.institution_id::text=split_part(name,'/',1) and o.id::text=split_part(name,'/',2) and campus_private.can_teach(o.institution_id,o.id))
);
create policy campus_file_read on storage.objects for select to authenticated using(
 bucket_id='campus-materials' and exists(select 1 from public.materials m where m.object_path=name)
);
