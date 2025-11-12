-- ================================================================
-- FIX MISSING COLUMNS IN PROPERTIES TABLE
-- ================================================================
-- This adds any missing columns that are causing schema cache errors
-- Safe to run - will not delete data
-- ================================================================

-- Add state column if it doesn't exist (already in setup.sql but might be missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN state text;
        RAISE NOTICE '✓ Added state column to properties table';
    ELSE
        RAISE NOTICE '→ state column already exists';
    END IF;
END $$;

-- Add postal_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN postal_code text;
        RAISE NOTICE '✓ Added postal_code column to properties table';
    ELSE
        RAISE NOTICE '→ postal_code column already exists';
    END IF;
END $$;

-- Add latitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN latitude double precision;
        RAISE NOTICE '✓ Added latitude column to properties table';
    ELSE
        RAISE NOTICE '→ latitude column already exists';
    END IF;
END $$;

-- Add longitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN longitude double precision;
        RAISE NOTICE '✓ Added longitude column to properties table';
    ELSE
        RAISE NOTICE '→ longitude column already exists';
    END IF;
END $$;

-- Add neighborhood column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'neighborhood'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN neighborhood text;
        RAISE NOTICE '✓ Added neighborhood column to properties table';
    ELSE
        RAISE NOTICE '→ neighborhood column already exists';
    END IF;
END $$;

-- Add walk_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'walk_score'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN walk_score integer;
        RAISE NOTICE '✓ Added walk_score column to properties table';
    ELSE
        RAISE NOTICE '→ walk_score column already exists';
    END IF;
END $$;

-- Add transit_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'transit_score'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN transit_score integer;
        RAISE NOTICE '✓ Added transit_score column to properties table';
    ELSE
        RAISE NOTICE '→ transit_score column already exists';
    END IF;
END $$;

-- Add walkthrough_video_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'walkthrough_video_url'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN walkthrough_video_url text;
        RAISE NOTICE '✓ Added walkthrough_video_url column to properties table';
    ELSE
        RAISE NOTICE '→ walkthrough_video_url column already exists';
    END IF;
END $$;

-- Add is_featured column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
        RAISE NOTICE '✓ Added is_featured column to properties table';
    ELSE
        RAISE NOTICE '→ is_featured column already exists';
    END IF;
END $$;

-- Add is_verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
        RAISE NOTICE '✓ Added is_verified column to properties table';
    ELSE
        RAISE NOTICE '→ is_verified column already exists';
    END IF;
END $$;

-- Verify the fixes
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    expected_columns TEXT[] := ARRAY[
        'id', 'slug', 'landlord_id', 'title', 'description', 'price', 'beds', 'baths', 
        'area', 'type', 'address', 'city', 'state', 'postal_code', 'latitude', 'longitude', 
        'neighborhood', 'images', 'amenities', 'pets', 'smoking', 'parking', 'rent_frequency', 
        'status', 'verified', 'furnished', 'available_from', 'is_featured', 'is_verified', 
        'walk_score', 'transit_score', 'walkthrough_video_url', 'created_at', 'updated_at'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'properties' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROPERTIES COLUMN FIX COMPLETED!';
    RAISE NOTICE '========================================';
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✓✓✓ SUCCESS ✓✓✓';
        RAISE NOTICE 'All required columns are present in properties table!';
        RAISE NOTICE 'Schema errors should be resolved.';
    ELSE
        RAISE NOTICE '⚠ WARNING: Some columns are still missing:';
        FOREACH col IN ARRAY missing_columns
        LOOP
            RAISE NOTICE '  ✗ %', col;
        END LOOP;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show current properties table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
ORDER BY ordinal_position;
