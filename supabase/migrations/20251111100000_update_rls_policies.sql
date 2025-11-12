-- Update RLS policies to allow safe updates on applications and tours

-- Applications: allow landlords to update applications they own
DO $$
BEGIN
  EXECUTE 'drop policy if exists apps_update_landlord on public.applications';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.applications missing, skipping policy drop';
END $$;

DO $$
BEGIN
  EXECUTE $$create policy apps_update_landlord on public.applications
    for update using (auth.uid() = landlord_id)$$;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.applications missing, skipping policy create';
END $$;

-- Tours: allow participants (landlord or tenant) to update their tour rows
DO $$
BEGIN
  EXECUTE 'drop policy if exists tours_update_participants on public.tours';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.tours missing, skipping policy drop';
END $$;

DO $$
BEGIN
  EXECUTE $$create policy tours_update_participants on public.tours
    for update using (auth.uid() = landlord_id or auth.uid() = tenant_id)$$;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.tours missing, skipping policy create';
END $$;
