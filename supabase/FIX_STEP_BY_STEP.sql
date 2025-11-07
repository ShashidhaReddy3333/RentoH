-- =========================================================
-- STEP-BY-STEP FIX (Run each section separately)
-- Copy and run ONE section at a time
-- =========================================================

-- =========================================================
-- STEP 1: Add notes column to tours (run this first)
-- =========================================================
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON public.tours(scheduled_at);

-- You should see: "Success. No rows returned"


-- =========================================================
-- STEP 2: Find your landlord user (run this second)
-- =========================================================
-- This will show you available landlord users
SELECT 
    id as landlord_id,
    email,
    full_name,
    role
FROM public.profiles 
WHERE role = 'landlord'
ORDER BY created_at DESC;

-- COPY the 'landlord_id' value from the result
-- It will look like: 123e4567-e89b-12d3-a456-426614174000


-- =========================================================
-- IF NO LANDLORD USERS EXIST, run this to create one:
-- =========================================================
-- First sign up via your website with: shashidharreddy3333@gmail.com
-- Then run this:
UPDATE public.profiles 
SET role = 'landlord' 
WHERE email = 'shashidharreddy3333@gmail.com';

-- Then run STEP 2 again to get the landlord_id


-- =========================================================
-- STEP 3: Check which properties need fixing
-- =========================================================
SELECT 
    id,
    title,
    landlord_id,
    slug
FROM public.properties 
WHERE landlord_id IS NULL;

-- This shows which properties have no landlord


-- =========================================================
-- STEP 4: Update properties with your landlord ID
-- =========================================================
-- IMPORTANT: Replace 'YOUR-ACTUAL-UUID-HERE' with the landlord_id from STEP 2
-- Example (DO NOT USE THIS EXACT ID):
-- UPDATE public.properties SET landlord_id = '123e4567-e89b-12d3-a456-426614174000' WHERE landlord_id IS NULL;

-- YOUR COMMAND (edit the UUID below, then run):
UPDATE public.properties 
SET landlord_id = 'YOUR-ACTUAL-UUID-HERE' 
WHERE landlord_id IS NULL;


-- =========================================================
-- STEP 5: Verify everything is fixed
-- =========================================================
-- Check 1: Tours has notes column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'notes';
-- Should return: notes

-- Check 2: All properties have landlord
SELECT COUNT(*) as properties_without_landlord 
FROM public.properties 
WHERE landlord_id IS NULL;
-- Should return: 0

-- Check 3: View properties with their landlords
SELECT 
    p.id,
    p.title,
    p.landlord_id,
    prof.email as landlord_email
FROM public.properties p
LEFT JOIN public.profiles prof ON p.landlord_id = prof.id
LIMIT 5;
-- All should have landlord_id and landlord_email

-- =========================================================
-- SUCCESS! Your app should now work
-- =========================================================
