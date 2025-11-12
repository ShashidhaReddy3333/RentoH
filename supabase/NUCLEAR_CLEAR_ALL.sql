-- ================================================================
-- NUCLEAR OPTION: CLEAR EVERYTHING INCLUDING AUTH USERS
-- ================================================================
-- ⚠️⚠️⚠️ EXTREME WARNING ⚠️⚠️⚠️
-- This will DELETE:
-- - All data from all tables
-- - All user accounts from auth.users
-- - All authentication sessions
-- 
-- This does NOT delete:
-- - Table structures
-- - RLS policies
-- - Functions/triggers
-- ================================================================
-- Use this if CLEAR_ALL_DATA.sql didn't work
-- ================================================================

BEGIN;

-- Disable all triggers and constraints temporarily
SET CONSTRAINTS ALL DEFERRED;

-- Clear all data using TRUNCATE (fastest method)
-- TRUNCATE removes all rows and resets any sequences
-- CASCADE automatically clears dependent tables

TRUNCATE TABLE 
  public.messages,
  public.message_threads,
  public.applications,
  public.tours,
  public.favorites,
  public.saved_properties,
  public.user_preferences,
  public.properties,
  public.profiles
CASCADE;

-- Also clear auth-related tables
TRUNCATE TABLE 
  auth.users 
CASCADE;

-- Clear any sessions
TRUNCATE TABLE 
  auth.sessions,
  auth.refresh_tokens
CASCADE;

COMMIT;

-- Verify everything is cleared
DO $$
DECLARE
  total_profiles INTEGER;
  total_properties INTEGER;
  total_auth_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO total_properties FROM public.properties;
  SELECT COUNT(*) INTO total_auth_users FROM auth.users;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NUCLEAR CLEAR COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profiles remaining: %', total_profiles;
  RAISE NOTICE 'Properties remaining: %', total_properties;
  RAISE NOTICE 'Auth users remaining: %', total_auth_users;
  RAISE NOTICE '';
  
  IF total_profiles = 0 AND total_properties = 0 AND total_auth_users = 0 THEN
    RAISE NOTICE '✓✓✓ COMPLETE SUCCESS ✓✓✓';
    RAISE NOTICE 'All data and users deleted!';
    RAISE NOTICE 'Database is completely empty.';
    RAISE NOTICE 'You can now sign up with fresh accounts.';
  ELSE
    RAISE NOTICE '⚠ ERROR: Some data still remains!';
    RAISE NOTICE 'You may need to check RLS policies or permissions.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
