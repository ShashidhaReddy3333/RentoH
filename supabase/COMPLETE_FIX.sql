-- =========================================================
-- COMPLETE FIX FOR TOUR REQUESTS & APPLICATIONS
-- This script fixes all known issues in ONE RUN
-- =========================================================
-- Run this script in Supabase SQL Editor
-- Copy ALL of this and paste into SQL Editor, then click RUN
-- =========================================================

-- =========================================================
-- PART 1: Add missing notes column to tours table
-- =========================================================
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS notes text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON public.tours(scheduled_at);

-- Add comment for documentation
COMMENT ON COLUMN public.tours.notes IS 'Optional notes from tenant when requesting a tour';

-- Verify: notes column now exists
SELECT 'STEP 1 COMPLETE: notes column added to tours table' as status;


-- =========================================================
-- PART 2: Ensure landlord user exists
-- =========================================================
-- Check if any landlord users exist
DO $$
DECLARE
    landlord_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO landlord_count 
    FROM public.profiles 
    WHERE role = 'landlord';
    
    IF landlord_count = 0 THEN
        RAISE NOTICE '⚠️  WARNING: No landlord users found!';
        RAISE NOTICE 'Please sign up on your website, then run:';
        RAISE NOTICE 'UPDATE profiles SET role = ''landlord'' WHERE email = ''your-email@example.com'';';
    ELSE
        RAISE NOTICE '✅ Found % landlord user(s)', landlord_count;
    END IF;
END $$;


-- =========================================================
-- PART 3: Show available landlords
-- =========================================================
SELECT 
    '🏢 AVAILABLE LANDLORD USERS' as section,
    id as landlord_id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'landlord'
ORDER BY created_at DESC;

-- ⚠️ IMPORTANT: Copy one of the 'landlord_id' values from above
-- You'll need it for the next step!


-- =========================================================
-- PART 4: Show properties that need landlord_id
-- =========================================================
SELECT 
    '🏠 PROPERTIES WITHOUT LANDLORD' as section,
    id,
    title,
    slug,
    landlord_id,
    status,
    created_at
FROM public.properties 
WHERE landlord_id IS NULL
ORDER BY created_at DESC;

-- If this returns rows, you MUST assign a landlord in the next step!


-- =========================================================
-- PART 5: AUTO-ASSIGN LANDLORD TO PROPERTIES
-- =========================================================
-- This will automatically assign the first landlord to all properties
-- that don't have one. Only runs if landlords exist.
DO $$
DECLARE
    first_landlord_id UUID;
    properties_updated INTEGER;
BEGIN
    -- Get the first available landlord
    SELECT id INTO first_landlord_id
    FROM public.profiles 
    WHERE role = 'landlord'
    ORDER BY created_at
    LIMIT 1;
    
    IF first_landlord_id IS NOT NULL THEN
        -- Update all properties without a landlord
        UPDATE public.properties 
        SET landlord_id = first_landlord_id
        WHERE landlord_id IS NULL;
        
        GET DIAGNOSTICS properties_updated = ROW_COUNT;
        
        RAISE NOTICE '✅ Assigned landlord % to % properties', 
                     first_landlord_id, properties_updated;
    ELSE
        RAISE NOTICE '⚠️  No landlord found - properties not updated';
    END IF;
END $$;


-- =========================================================
-- PART 6: VERIFICATION - Check if everything is fixed
-- =========================================================
SELECT '🔍 VERIFICATION RESULTS' as section;

SELECT 
    'notes_column_exists' as check_name,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'tours' 
          AND column_name = 'notes'
    ) as passed,
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'tours' 
          AND column_name = 'notes'
    ) THEN '✅ Pass' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'all_properties_have_landlord',
    (SELECT COUNT(*) FROM public.properties WHERE landlord_id IS NULL) = 0,
    CASE WHEN (SELECT COUNT(*) FROM public.properties WHERE landlord_id IS NULL) = 0 
         THEN '✅ Pass' ELSE '❌ FAIL' END
UNION ALL
SELECT 
    'landlord_users_exist',
    EXISTS(SELECT 1 FROM public.profiles WHERE role = 'landlord'),
    CASE WHEN EXISTS(SELECT 1 FROM public.profiles WHERE role = 'landlord')
         THEN '✅ Pass' ELSE '❌ FAIL' END
UNION ALL
SELECT 
    'tours_insert_policy_exists',
    EXISTS(SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tours' AND policyname = 'tours_insert'),
    CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tours' AND policyname = 'tours_insert')
         THEN '✅ Pass' ELSE '❌ FAIL' END
UNION ALL
SELECT 
    'apps_insert_policy_exists',
    EXISTS(SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'apps_insert'),
    CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'apps_insert')
         THEN '✅ Pass' ELSE '❌ FAIL' END;


-- =========================================================
-- PART 7: SUMMARY - What was fixed
-- =========================================================
SELECT '📊 SUMMARY' as section;

SELECT 
    (SELECT COUNT(*) FROM public.properties) as total_properties,
    (SELECT COUNT(*) FROM public.properties WHERE landlord_id IS NOT NULL) as properties_with_landlord,
    (SELECT COUNT(*) FROM public.properties WHERE landlord_id IS NULL) as properties_without_landlord,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'landlord') as total_landlords,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'tenant') as total_tenants,
    (SELECT COUNT(*) FROM public.tours) as total_tours,
    (SELECT COUNT(*) FROM public.applications) as total_applications;


-- =========================================================
-- IF NO LANDLORD USERS EXIST, RUN THIS MANUALLY:
-- =========================================================
-- 1. First, sign up on your website with your email
-- 2. Then uncomment and run this (replace with your email):
--
-- UPDATE public.profiles 
-- SET role = 'landlord' 
-- WHERE email = 'shashidharreddy3333@gmail.com';
--
-- 3. Then re-run PART 5 to auto-assign landlord to properties


-- =========================================================
-- MANUAL OVERRIDE: Assign specific landlord to specific properties
-- =========================================================
-- If you need to manually assign landlords, use this template:
--
-- UPDATE public.properties 
-- SET landlord_id = 'your-landlord-uuid-here'
-- WHERE id = 'specific-property-uuid-here';
--
-- OR assign to all properties at once:
--
-- UPDATE public.properties 
-- SET landlord_id = 'your-landlord-uuid-here'
-- WHERE landlord_id IS NULL;


-- =========================================================
-- SUCCESS! 
-- =========================================================
-- If all verification checks show ✅ Pass, then:
-- 1. Tour requests should now work
-- 2. Applications should now work
-- 3. No code deployment needed - database fix is LIVE immediately!
--
-- Test it now:
-- 1. Go to any property page
-- 2. Click "Request a tour" - should work!
-- 3. Click "Apply now" - should work!
-- =========================================================
