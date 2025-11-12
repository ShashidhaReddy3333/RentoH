-- ================================================================
-- VERIFY DATABASE STATE
-- ================================================================
-- Use this to check how much data is in your database
-- Run this BEFORE and AFTER clearing data
-- ================================================================

-- Count all records in each table
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles

UNION ALL

SELECT 
  'properties' as table_name,
  COUNT(*) as record_count
FROM public.properties

UNION ALL

SELECT 
  'message_threads' as table_name,
  COUNT(*) as record_count
FROM public.message_threads

UNION ALL

SELECT 
  'messages' as table_name,
  COUNT(*) as record_count
FROM public.messages

UNION ALL

SELECT 
  'applications' as table_name,
  COUNT(*) as record_count
FROM public.applications

UNION ALL

SELECT 
  'tours' as table_name,
  COUNT(*) as record_count
FROM public.tours

UNION ALL

SELECT 
  'favorites' as table_name,
  COUNT(*) as record_count
FROM public.favorites

UNION ALL

SELECT 
  'saved_properties' as table_name,
  COUNT(*) as record_count
FROM public.saved_properties

UNION ALL

SELECT 
  'user_preferences' as table_name,
  COUNT(*) as record_count
FROM public.user_preferences

UNION ALL

SELECT 
  'auth.users' as table_name,
  COUNT(*) as record_count
FROM auth.users

ORDER BY record_count DESC;

-- Show some sample data if exists
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  IF profile_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE DATA IN DATABASE:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'First 5 profiles:';
    
    -- This will show in the query results
  END IF;
END $$;

-- Show first 5 profiles (if any)
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Show first 5 properties (if any)
SELECT id, title, city, price, created_at 
FROM public.properties 
ORDER BY created_at DESC 
LIMIT 5;
