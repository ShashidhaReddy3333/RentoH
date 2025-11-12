-- ================================================================
-- FIX MISSING COLUMNS IN PROFILES TABLE
-- ================================================================
-- This adds the missing 'prefs' and 'notifications' columns
-- that are causing the schema cache error
-- ================================================================
-- Safe to run - will not delete data
-- ================================================================

-- Add prefs column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'prefs'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN prefs jsonb NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE '✓ Added prefs column to profiles table';
    ELSE
        RAISE NOTICE '→ prefs column already exists';
    END IF;
END $$;

-- Add notifications column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN notifications jsonb NOT NULL DEFAULT '{"newMatches":true,"messages":true,"applicationUpdates":true}'::jsonb;
        RAISE NOTICE '✓ Added notifications column to profiles table';
    ELSE
        RAISE NOTICE '→ notifications column already exists';
    END IF;
END $$;

-- Add city column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN city text;
        RAISE NOTICE '✓ Added city column to profiles table';
    ELSE
        RAISE NOTICE '→ city column already exists';
    END IF;
END $$;

-- Add address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN address text;
        RAISE NOTICE '✓ Added address column to profiles table';
    ELSE
        RAISE NOTICE '→ address column already exists';
    END IF;
END $$;

-- Add contact_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'contact_method'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN contact_method text CHECK (contact_method IN ('email', 'phone', 'chat'));
        RAISE NOTICE '✓ Added contact_method column to profiles table';
    ELSE
        RAISE NOTICE '→ contact_method column already exists';
    END IF;
END $$;

-- Add dob column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'dob'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN dob text;
        RAISE NOTICE '✓ Added dob (date of birth) column to profiles table';
    ELSE
        RAISE NOTICE '→ dob column already exists';
    END IF;
END $$;

-- Add bio column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN bio text;
        RAISE NOTICE '✓ Added bio column to profiles table';
    ELSE
        RAISE NOTICE '→ bio column already exists';
    END IF;
END $$;

-- Fix verification_status default value if needed
DO $$ 
BEGIN
    -- Check if verification_status has correct check constraint
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
    
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_verification_status_check 
    CHECK (verification_status IN ('verified', 'pending', 'unverified'));
    
    RAISE NOTICE '✓ Updated verification_status check constraint';
END $$;

-- Verify the fixes
DO $$
DECLARE
    has_prefs BOOLEAN;
    has_notifications BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'prefs'
    ) INTO has_prefs;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications'
    ) INTO has_notifications;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COLUMN FIX COMPLETED!';
    RAISE NOTICE '========================================';
    
    IF has_prefs AND has_notifications THEN
        RAISE NOTICE '✓✓✓ SUCCESS ✓✓✓';
        RAISE NOTICE 'All required columns are present:';
        RAISE NOTICE '  ✓ prefs column exists';
        RAISE NOTICE '  ✓ notifications column exists';
        RAISE NOTICE '';
        RAISE NOTICE 'The "prefs column not found" error should be fixed!';
        RAISE NOTICE 'Refresh your application page to verify.';
    ELSE
        IF NOT has_prefs THEN
            RAISE NOTICE '✗ prefs column is STILL missing';
        END IF;
        IF NOT has_notifications THEN
            RAISE NOTICE '✗ notifications column is STILL missing';
        END IF;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show current profiles table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
