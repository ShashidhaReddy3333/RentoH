-- =========================================================
-- CRITICAL FIX: Tours and Applications Not Working
-- Run this entire script in Supabase SQL Editor
-- Time required: 30 seconds
-- =========================================================

-- =========================================================
-- FIX #1: Add missing 'notes' column to tours table
-- =========================================================
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS notes text;

-- Add performance indexes for tour queries
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON public.tours(scheduled_at);

-- Add documentation
COMMENT ON COLUMN public.tours.notes IS 'Optional notes from tenant when requesting a tour';

-- =========================================================
-- FIX #2: Find properties without landlord_id
-- =========================================================
-- First, let's see which properties need fixing
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count FROM public.properties WHERE landlord_id IS NULL;
    
    IF missing_count > 0 THEN
        RAISE NOTICE 'Found % properties without landlord_id', missing_count;
        RAISE NOTICE 'You need to assign these properties to a landlord.';
    ELSE
        RAISE NOTICE 'All properties have landlord_id - no action needed!';
    END IF;
END $$;

-- =========================================================
-- FIX #2a: Get available landlord users
-- =========================================================
-- Show landlord users you can assign properties to
SELECT 
    id as landlord_id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'landlord'
ORDER BY created_at DESC;

-- If the above query returns NO results, you need to create a landlord first:
-- 1. Sign up via the website with landlord account
-- 2. Then run this to set their role:
--    UPDATE public.profiles SET role = 'landlord' WHERE email = 'your-email@example.com';

-- =========================================================
-- FIX #2b: Update properties to have a landlord
-- =========================================================
-- IMPORTANT: Replace 'YOUR-LANDLORD-ID-HERE' with an actual ID from the query above
-- Example: UPDATE public.properties SET landlord_id = '123e4567-e89b-12d3-a456-426614174000' WHERE landlord_id IS NULL;

-- Uncomment and modify this line with your landlord ID:
-- UPDATE public.properties SET landlord_id = 'YOUR-LANDLORD-ID-HERE' WHERE landlord_id IS NULL;

-- =========================================================
-- VERIFICATION: Check if fixes worked
-- =========================================================

-- 1. Verify tours table has notes column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND column_name = 'notes';
-- Expected: 1 row showing 'notes' column

-- 2. Check if any properties still missing landlord
SELECT COUNT(*) as properties_without_landlord 
FROM public.properties 
WHERE landlord_id IS NULL;
-- Expected: 0

-- 3. Show all properties with their landlords
SELECT 
    p.id,
    p.title,
    p.landlord_id,
    prof.email as landlord_email,
    prof.full_name as landlord_name
FROM public.properties p
LEFT JOIN public.profiles prof ON p.landlord_id = prof.id
ORDER BY p.created_at DESC
LIMIT 10;
-- All rows should have landlord_id, landlord_email, and landlord_name

-- =========================================================
-- SUCCESS MESSAGE
-- =========================================================
DO $$
DECLARE
    tours_fixed BOOLEAN;
    props_fixed BOOLEAN;
BEGIN
    -- Check tours
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' AND column_name = 'notes'
    ) INTO tours_fixed;
    
    -- Check properties
    SELECT NOT EXISTS(
        SELECT 1 FROM public.properties WHERE landlord_id IS NULL
    ) INTO props_fixed;
    
    IF tours_fixed AND props_fixed THEN
        RAISE NOTICE '✅ SUCCESS! All fixes applied correctly.';
        RAISE NOTICE '✅ Tours table now has notes column';
        RAISE NOTICE '✅ All properties have landlord_id';
        RAISE NOTICE '';
        RAISE NOTICE '🎉 Your app should now work correctly!';
        RAISE NOTICE 'Test: Request a tour with notes';
        RAISE NOTICE 'Test: Submit an application';
    ELSIF tours_fixed AND NOT props_fixed THEN
        RAISE NOTICE '⚠️ Tours fixed, but properties still need landlord_id';
        RAISE NOTICE 'Action: Update the properties query above with your landlord ID';
    ELSE
        RAISE NOTICE '❌ Something went wrong. Check the verification queries above.';
    END IF;
END $$;

-- =========================================================
-- OPTIONAL: Add helpful policies for tour updates
-- =========================================================

-- Allow landlords to update tour status (requested → confirmed)
DROP POLICY IF EXISTS tours_update_landlord ON public.tours;
CREATE POLICY tours_update_landlord ON public.tours
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

-- Allow tenants to cancel their own tours
DROP POLICY IF EXISTS tours_update_tenant ON public.tours;
CREATE POLICY tours_update_tenant ON public.tours
  FOR UPDATE USING (
    auth.uid() = tenant_id AND status = 'requested'
  )
  WITH CHECK (
    auth.uid() = tenant_id AND status = 'cancelled'
  );

-- =========================================================
-- END OF SCRIPT
-- =========================================================
-- After running this script:
-- 1. Visit your property page - should load without errors
-- 2. Try requesting a tour with notes - should work
-- 3. Try submitting an application - should work
-- =========================================================
