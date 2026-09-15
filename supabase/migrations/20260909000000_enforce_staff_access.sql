-- Enforce the two hotel-staff roles in the database. Run with `supabase db push`
-- or paste this migration into the Supabase SQL editor.
--
-- Public visitors may read rooms/offers/gallery and submit bookings/contact forms.
-- Receptionists may manage reservations and messages. Only admins may change
-- rooms, offers, gallery, or journal content.

drop policy if exists "Authenticated users manage rooms" on public.rooms;
drop policy if exists "Anyone can view available room types" on public.rooms;
create policy "Public can view rooms" on public.rooms for select using (true);
create policy "Admins manage rooms" on public.rooms for all to authenticated
  using (public.current_staff_role() = 'admin')
  with check (public.current_staff_role() = 'admin');

drop policy if exists "Authenticated users manage bookings" on public.bookings;
drop policy if exists "Allow public insert" on public.bookings;
drop policy if exists "Allow public select" on public.bookings;
drop policy if exists "Allow public update" on public.bookings;
drop policy if exists "Allow public delete" on public.bookings;
create policy "Visitors create bookings" on public.bookings for insert to anon, authenticated
  with check (true);
create policy "Staff view bookings" on public.bookings for select to authenticated
  using (public.current_staff_role() in ('admin', 'receptionist'));
create policy "Staff update bookings" on public.bookings for update to authenticated
  using (public.current_staff_role() in ('admin', 'receptionist'))
  with check (public.current_staff_role() in ('admin', 'receptionist'));

-- Apply the same role model to optional content tables only when they exist.
do $$
declare table_name text;
begin
  foreach table_name in array array['offers', 'gallery_images', 'journal_posts'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists "Public reads content" on public.%I', table_name);
      execute format('drop policy if exists "Admins manage content" on public.%I', table_name);
      -- Legacy setup scripts used permissive authenticated-user policies.
      execute format('drop policy if exists "Enable read access for all users" on public.%I', table_name);
      execute format('drop policy if exists "Enable full access for authenticated users" on public.%I', table_name);
      execute format('drop policy if exists "Allow public read-only access." on public.%I', table_name);
      execute format('drop policy if exists "Allow authenticated insert." on public.%I', table_name);
      execute format('drop policy if exists "Allow authenticated update." on public.%I', table_name);
      execute format('drop policy if exists "Allow authenticated delete." on public.%I', table_name);
      execute format('create policy "Public reads content" on public.%I for select using (true)', table_name);
      execute format('create policy "Admins manage content" on public.%I for all to authenticated using (public.current_staff_role() = ''admin'') with check (public.current_staff_role() = ''admin'')', table_name);
    end if;
  end loop;

  if to_regclass('public.contacts') is not null then
    alter table public.contacts enable row level security;
    drop policy if exists "Visitors create contacts" on public.contacts;
    drop policy if exists "Staff view contacts" on public.contacts;
    drop policy if exists "Staff update contacts" on public.contacts;
    drop policy if exists "Allow public insert" on public.contacts;
    drop policy if exists "Allow public select" on public.contacts;
    drop policy if exists "Allow update" on public.contacts;
    create policy "Visitors create contacts" on public.contacts for insert to anon, authenticated with check (true);
    create policy "Staff view contacts" on public.contacts for select to authenticated using (public.current_staff_role() in ('admin', 'receptionist'));
    create policy "Staff update contacts" on public.contacts for update to authenticated using (public.current_staff_role() in ('admin', 'receptionist')) with check (public.current_staff_role() in ('admin', 'receptionist'));
  end if;
end $$;

notify pgrst, 'reload schema';
