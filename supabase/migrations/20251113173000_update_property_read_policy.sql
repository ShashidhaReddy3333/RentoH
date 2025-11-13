-- Ensure public renters can read any active listing regardless of verification state
DO $$
BEGIN
  EXECUTE 'drop policy if exists properties_read_public on public.properties';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.properties missing, skipping policy drop';
END $$;

DO $$
BEGIN
  EXECUTE 'create policy properties_read_public on public.properties
    for select using (status = ''active'')';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'public.properties missing, skipping policy create';
END $$;
