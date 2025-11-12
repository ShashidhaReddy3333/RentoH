-- ================================================================
-- CLEAR ALL DATA FROM DATABASE
-- ================================================================
-- ⚠️ WARNING: This will DELETE ALL DATA but keep the schema/structure
-- ⚠️ Tables, policies, and functions remain intact
-- ⚠️ Only the data is deleted
-- ================================================================
-- How to use:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and click "Run"
-- ================================================================

-- Temporarily disable triggers to speed up deletion
SET session_replication_role = 'replica';

-- Delete data in correct order (respecting foreign keys)
-- Start with child tables, work up to parent tables

-- Step 1: Delete messages (no foreign keys pointing to it)
DELETE FROM public.messages;
RAISE NOTICE 'Deleted all messages';

-- Step 2: Delete message threads (messages depend on this)
DELETE FROM public.message_threads;
RAISE NOTICE 'Deleted all message threads';

-- Step 3: Delete applications (depends on properties and profiles)
DELETE FROM public.applications;
RAISE NOTICE 'Deleted all applications';

-- Step 4: Delete tours (depends on properties and profiles)
DELETE FROM public.tours;
RAISE NOTICE 'Deleted all tours';

-- Step 5: Delete favorites (depends on properties and profiles)
DELETE FROM public.favorites;
RAISE NOTICE 'Deleted all favorites';

-- Step 6: Delete saved_properties (depends on properties and profiles)
DELETE FROM public.saved_properties;
RAISE NOTICE 'Deleted all saved properties';

-- Step 7: Delete user preferences (depends on profiles)
DELETE FROM public.user_preferences;
RAISE NOTICE 'Deleted all user preferences';

-- Step 8: Delete properties (depends on profiles for landlord_id)
DELETE FROM public.properties;
RAISE NOTICE 'Deleted all properties';

-- Step 9: Delete profiles (parent table)
DELETE FROM public.profiles;
RAISE NOTICE 'Deleted all profiles';

-- Step 10: Delete auth users (if you want to clear authentication too)
-- ⚠️ UNCOMMENT ONLY IF YOU WANT TO DELETE ALL USER ACCOUNTS
-- DELETE FROM auth.users;
-- RAISE NOTICE 'Deleted all auth users';

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences to start IDs from 1 (if any auto-increment columns exist)
-- Note: We use UUIDs, so no sequences to reset

-- Verify deletion
DO $$
DECLARE
  profile_count INTEGER;
  property_count INTEGER;
  tour_count INTEGER;
  application_count INTEGER;
  message_count INTEGER;
  favorite_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO tour_count FROM public.tours;
  SELECT COUNT(*) INTO application_count FROM public.applications;
  SELECT COUNT(*) INTO message_count FROM public.messages;
  SELECT COUNT(*) INTO favorite_count FROM public.favorites;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA DELETION COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining records:';
  RAISE NOTICE '  Profiles: %', profile_count;
  RAISE NOTICE '  Properties: %', property_count;
  RAISE NOTICE '  Tours: %', tour_count;
  RAISE NOTICE '  Applications: %', application_count;
  RAISE NOTICE '  Messages: %', message_count;
  RAISE NOTICE '  Favorites: %', favorite_count;
  RAISE NOTICE '';
  
  IF profile_count = 0 AND property_count = 0 THEN
    RAISE NOTICE '✓ All data successfully deleted!';
    RAISE NOTICE '✓ Database schema intact';
    RAISE NOTICE '✓ RLS policies intact';
    RAISE NOTICE '✓ Ready for fresh data';
  ELSE
    RAISE NOTICE '⚠ Some data remains - check foreign key constraints';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
