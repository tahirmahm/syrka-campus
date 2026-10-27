-- Tenant creation is operator-only for the pilot. No self-service elevation surface.
-- First administrator bootstrap is documented in docs/operations.md.
-- Register each institutional administrator through Supabase Auth before bootstrap.
create index materials_object_path_idx on public.materials(object_path) where object_path is not null;
create index assignments_offering_idx on public.assignments(institution_id,offering_id);
create index registration_window_term_idx on public.registration_windows(institution_id,term_id,opens_at,closes_at);
create index modules_offering_idx on public.modules(institution_id,offering_id);
create index announcements_offering_idx on public.announcements(institution_id,offering_id);
