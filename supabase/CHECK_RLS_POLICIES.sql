-- =========================================================
-- Check if RLS policies are blocking tours and applications
-- Run this in Supabase SQL Editor to diagnose issues
-- =========================================================

-- =========================================================
-- CHECK 1: View all policies on tours table
-- =========================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tours'
ORDER BY policyname;

-- Expected policies:
-- - tours_read_self (SELECT for tenant)
-- - tours_read_landlord (SELECT for landlord)
-- - tours_insert (INSERT for tenant)


-- =========================================================
-- CHECK 2: View all policies on applications table
-- =========================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Expected policies:
-- - apps_read_tenant (SELECT for tenant)
-- - apps_read_landlord (SELECT for landlord)
-- - apps_insert (INSERT for tenant)


-- =========================================================
-- CHECK 3: Test tour insertion manually
-- =========================================================
-- Replace these UUIDs with real values from your database:
-- - YOUR-PROPERTY-ID: id from properties table
-- - YOUR-LANDLORD-ID: landlord_id from properties table
-- - YOUR-TENANT-ID: your user id from auth.users

-- First, get some test IDs:
SELECT 
    p.id as property_id,
    p.landlord_id,
    p.title
FROM public.properties p
LIMIT 1;

-- Then try to insert a tour (as a test, delete it after)
-- Uncomment and fill in the IDs:
/*
INSERT INTO public.tours (
    property_id,
    landlord_id,
    tenant_id,
    scheduled_at,
    status,
    notes
) VALUES (
    'PROPERTY-ID-HERE',
    'LANDLORD-ID-HERE',
    'YOUR-USER-ID-HERE',
    NOW() + INTERVAL '1 day',
    'requested',
    'Test tour request'
);
*/

-- If the above fails, check the error message


-- =========================================================
-- CHECK 4: Test application insertion manually
-- =========================================================
-- Uncomment and fill in the IDs:
/*
INSERT INTO public.applications (
    property_id,
    landlord_id,
    tenant_id,
    status,
    submitted_at,
    message,
    monthly_income
) VALUES (
    'PROPERTY-ID-HERE',
    'LANDLORD-ID-HERE',
    'YOUR-USER-ID-HERE',
    'submitted',
    NOW(),
    'Test application',
    5000
);
*/

-- If the above fails, check the error message


-- =========================================================
-- CHECK 5: Verify RLS is not too restrictive
-- =========================================================

-- Check if tours INSERT policy allows tenant_id = auth.uid()
-- This should return the policy definition:
SELECT 
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polname = 'tours_insert';

-- Check if applications INSERT policy allows tenant_id = auth.uid()
SELECT 
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polname = 'apps_insert';


-- =========================================================
-- FIX: If policies are missing, run these
-- =========================================================

-- Ensure tours INSERT policy exists
DROP POLICY IF EXISTS tours_insert ON public.tours;
CREATE POLICY tours_insert ON public.tours
  FOR INSERT 
  WITH CHECK (auth.uid() = tenant_id);

-- Ensure applications INSERT policy exists
DROP POLICY IF EXISTS apps_insert ON public.applications;
CREATE POLICY apps_insert ON public.applications
  FOR INSERT 
  WITH CHECK (auth.uid() = tenant_id);


-- =========================================================
-- CHECK 6: Test as authenticated user
-- =========================================================
-- This simulates what happens when a user is logged in
-- Replace 'YOUR-USER-ID' with your actual user ID

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "YOUR-USER-ID"}';

-- Try selecting from tours (should work)
SELECT COUNT(*) FROM public.tours;

-- Try selecting from applications (should work)
SELECT COUNT(*) FROM public.applications;

RESET ROLE;


-- =========================================================
-- DIAGNOSTIC SUMMARY
-- =========================================================
DO $$
DECLARE
    tours_policies INTEGER;
    apps_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO tours_policies FROM pg_policies WHERE tablename = 'tours';
    SELECT COUNT(*) INTO apps_policies FROM pg_policies WHERE tablename = 'applications';
    
    RAISE NOTICE '=== RLS POLICY CHECK ===';
    RAISE NOTICE 'Tours table has % policies', tours_policies;
    RAISE NOTICE 'Applications table has % policies', apps_policies;
    
    IF tours_policies >= 3 AND apps_policies >= 3 THEN
        RAISE NOTICE '✅ Policies look good!';
        RAISE NOTICE 'If tours/applications still fail, check:';
        RAISE NOTICE '1. Are the code changes deployed to Vercel?';
        RAISE NOTICE '2. Check browser console for JavaScript errors';
        RAISE NOTICE '3. Check Vercel logs for server errors';
    ELSE
        RAISE NOTICE '⚠️ Missing policies detected';
        RAISE NOTICE 'Run the FIX section above';
    END IF;
END $$;
