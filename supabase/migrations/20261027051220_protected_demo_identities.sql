-- A public shared demo must not let visitors change its login identities or
-- deactivate the other demonstration roles. The registry is operator-managed.
create table campus_private.demo_accounts (
 user_id uuid primary key references auth.users(id),
 institution_id uuid not null references public.institutions(id)
);
alter table campus_private.demo_accounts enable row level security;
revoke all on campus_private.demo_accounts from public,anon,authenticated;
create index demo_accounts_institution_idx on campus_private.demo_accounts(institution_id);
create function campus_private.protect_demo_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from campus_private.demo_accounts where user_id=old.id) and
 (new.encrypted_password is distinct from old.encrypted_password or new.email is distinct from old.email or new.email_change is distinct from old.email_change) then
  raise exception 'Shared demonstration identities cannot be changed';
 end if;
 return new;
end; $$;
create trigger protect_campus_demo_identity before update of encrypted_password,email,email_change on auth.users for each row execute function campus_private.protect_demo_identity();
create function campus_private.protect_demo_membership() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from campus_private.demo_accounts where institution_id=coalesce(new.institution_id,old.institution_id)) then
  raise exception 'Shared demonstration membership configuration is fixed';
 end if;
 return coalesce(new,old);
end; $$;
create trigger protect_campus_demo_membership before insert or update or delete on public.memberships for each row execute function campus_private.protect_demo_membership();
revoke execute on function campus_private.protect_demo_identity(),campus_private.protect_demo_membership() from public,anon,authenticated;
