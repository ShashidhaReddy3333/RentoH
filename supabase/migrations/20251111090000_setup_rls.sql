DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.profiles missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.properties missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.message_threads missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.messages missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.favorites missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.saved_properties missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.applications missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.tours missing, skipping RLS enable';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.user_preferences missing, skipping RLS enable';
END $$;

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_upsert on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_read on public.profiles
  for select using (true);

create policy profiles_upsert on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists properties_read on public.properties;
drop policy if exists properties_insert on public.properties;
drop policy if exists properties_update on public.properties;
drop policy if exists properties_delete on public.properties;

create policy properties_read on public.properties
  for select using (true);

create policy properties_insert on public.properties
  for insert with check (auth.uid() = landlord_id);

create policy properties_update on public.properties
  for update using (auth.uid() = landlord_id);

create policy properties_delete on public.properties
  for delete using (auth.uid() = landlord_id);

drop policy if exists threads_read on public.message_threads;
drop policy if exists threads_insert on public.message_threads;
drop policy if exists threads_update on public.message_threads;

create policy threads_read on public.message_threads
  for select using (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy threads_insert on public.message_threads
  for insert with check (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy threads_update on public.message_threads
  for update using (auth.uid() = tenant_id or auth.uid() = landlord_id);

drop policy if exists messages_read on public.messages;
drop policy if exists messages_insert on public.messages;

create policy messages_read on public.messages
  for select using (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and (auth.uid() = t.tenant_id or auth.uid() = t.landlord_id)
    )
  );

create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and (auth.uid() = t.tenant_id or auth.uid() = t.landlord_id)
    )
  );

drop policy if exists fav_read on public.favorites;
drop policy if exists fav_write_ins on public.favorites;
drop policy if exists fav_write_upd on public.favorites;
drop policy if exists fav_write_del on public.favorites;

create policy fav_read on public.favorites
  for select using (auth.uid() = user_id);

create policy fav_write_ins on public.favorites
  for insert with check (auth.uid() = user_id);

create policy fav_write_upd on public.favorites
  for update using (auth.uid() = user_id);

create policy fav_write_del on public.favorites
  for delete using (auth.uid() = user_id);

drop policy if exists saved_read on public.saved_properties;
drop policy if exists saved_write_ins on public.saved_properties;
drop policy if exists saved_write_del on public.saved_properties;

create policy saved_read on public.saved_properties
  for select using (auth.uid() = user_id);

create policy saved_write_ins on public.saved_properties
  for insert with check (auth.uid() = user_id);

create policy saved_write_del on public.saved_properties
  for delete using (auth.uid() = user_id);

drop policy if exists apps_read_self on public.applications;
drop policy if exists apps_read_landlord on public.applications;
drop policy if exists apps_insert on public.applications;

create policy apps_read_self on public.applications
  for select using (auth.uid() = tenant_id);

create policy apps_read_landlord on public.applications
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.landlord_id = auth.uid()
    )
  );

create policy apps_insert on public.applications
  for insert with check (auth.uid() = tenant_id);

drop policy if exists tours_read_self on public.tours;
drop policy if exists tours_read_landlord on public.tours;
drop policy if exists tours_insert on public.tours;

create policy tours_read_self on public.tours
  for select using (auth.uid() = tenant_id);

create policy tours_read_landlord on public.tours
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.landlord_id = auth.uid()
    )
  );

create policy tours_insert on public.tours
  for insert with check (auth.uid() = tenant_id);

drop policy if exists prefs_read on public.user_preferences;
drop policy if exists prefs_upsert on public.user_preferences;
drop policy if exists prefs_update on public.user_preferences;

create policy prefs_read on public.user_preferences
  for select using (auth.uid() = user_id);

create policy prefs_upsert on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy prefs_update on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);