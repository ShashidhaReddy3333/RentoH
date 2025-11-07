-- =========================================================
-- DIAGNOSTIC QUERIES TO IDENTIFY TOUR & APPLICATION ISSUES
-- Run these in order to find the root cause
-- =========================================================

-- =========================================================
-- CHECK 1: Verify tours table has notes column
-- =========================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tours'
ORDER BY ordinal_position;

-- Expected: Should show 'notes' column of type 'text'


-- =========================================================
-- CHECK 2: Find properties WITHOUT landlord_id (CRITICAL)
-- =========================================================
SELECT 
    id,
    title,
    slug,
    landlord_id,
    status
FROM public.properties 
WHERE landlord_id IS NULL;

-- Expected: Should return 0 rows
-- If this returns rows, tour/application creation will fail!


-- =========================================================
-- CHECK 3: Verify RLS policies exist
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
WHERE schemaname = 'public' 
  AND tablename IN ('tours', 'applications')
ORDER BY tablename, policyname;

-- Expected: Should show insert policies for both tables


-- =========================================================
-- CHECK 4: Test user authentication (run while logged in)
-- =========================================================
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- If this returns NULL, authentication is not working


-- =========================================================
-- CHECK 5: Check for any failed tour/application attempts
-- =========================================================
-- Recent tours
SELECT 
    t.id,
    t.property_id,
    t.tenant_id,
    t.landlord_id,
    t.scheduled_at,
    t.status,
    t.notes,
    t.created_at,
    p.title as property_title
FROM public.tours t
LEFT JOIN public.properties p ON t.property_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Recent applications
SELECT 
    a.id,
    a.property_id,
    a.tenant_id,
    a.landlord_id,
    a.status,
    a.submitted_at,
    a.monthly_income,
    a.created_at,
    p.title as property_title
FROM public.applications a
LEFT JOIN public.properties p ON a.property_id = p.id
ORDER BY a.created_at DESC
LIMIT 10;


-- =========================================================
-- CHECK 6: Verify profiles exist and have roles
-- =========================================================
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Expected: Should show users with 'tenant' and 'landlord' roles


-- =========================================================
-- COMMON ISSUES AND FIXES
-- =========================================================

-- ISSUE 1: Properties missing landlord_id
-- FIX: Find a landlord user and assign to properties
-- Step 1: Find landlord
SELECT id, email, role FROM public.profiles WHERE role = 'landlord' LIMIT 1;

-- Step 2: Update properties (replace UUID with actual landlord_id from above)
-- UPDATE public.properties SET landlord_id = 'your-landlord-uuid-here' WHERE landlord_id IS NULL;


-- ISSUE 2: No landlord users exist
-- FIX: Make yourself a landlord
-- UPDATE public.profiles SET role = 'landlord' WHERE email = 'your-email@example.com';


-- ISSUE 3: Tours table missing notes column
-- FIX: Already provided in migrations/20250107_fix_tours_schema.sql
-- Run that migration if not already done


-- =========================================================
-- VERIFICATION TEST
-- =========================================================
-- After fixes, this should return TRUE for all checks:
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'notes') as has_notes_column,
    (SELECT COUNT(*) FROM public.properties WHERE landlord_id IS NULL) = 0 as all_properties_have_landlord,
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'tours' AND policyname = 'tours_insert') as has_tours_insert_policy,
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'apps_insert') as has_apps_insert_policy;

-- All columns should return TRUE
