-- Staff roles are held in auth.users app_metadata, not user_metadata.
-- app_metadata is not writable by a signed-in user, so it is safe for access
-- decisions in the web application.
--
-- Assign a role from the Supabase SQL editor (replace the email address):
--
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--   || jsonb_build_object('role', 'admin')
-- where email = 'admin@example.com';
--
-- For a receptionist, change 'admin' above to 'receptionist'.
-- The user must sign out and back in after the update so their JWT refreshes.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type public.staff_role as enum ('admin', 'receptionist');
  end if;
end $$;

-- Helper for future database policies. Keeping it in the database allows RLS
-- policies to use the same protected role source as the application.
create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
as $$
  select case auth.jwt() -> 'app_metadata' ->> 'role'
    when 'admin' then 'admin'::public.staff_role
    when 'receptionist' then 'receptionist'::public.staff_role
    else null
  end;
$$;
