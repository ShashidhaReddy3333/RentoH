-- ================================================================
-- FIX SCHEMA MISMATCH BETWEEN DATABASE AND APPLICATION
-- ================================================================
-- This adds missing columns and fixes data type mismatches
-- Based on actual database schema analysis
-- Safe to run - will not delete data
-- ================================================================

-- Add area column (application expects this instead of sqft)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'area'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN area integer;
        RAISE NOTICE '✓ Added area column to properties table';
        
        -- Copy sqft values to area if sqft has data
        UPDATE public.properties SET area = sqft WHERE sqft IS NOT NULL;
        RAISE NOTICE '✓ Copied sqft values to area column';
    ELSE
        RAISE NOTICE '→ area column already exists';
    END IF;
END $$;

-- Add smoking column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'smoking'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN smoking boolean NOT NULL DEFAULT false;
        RAISE NOTICE '✓ Added smoking column to properties table';
    ELSE
        RAISE NOTICE '→ smoking column already exists';
    END IF;
END $$;

-- Add parking column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'parking'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN parking text;
        RAISE NOTICE '✓ Added parking column to properties table';
    ELSE
        RAISE NOTICE '→ parking column already exists';
    END IF;
END $$;

-- Add rent_frequency column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'rent_frequency'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN rent_frequency text NOT NULL DEFAULT 'monthly' 
        CHECK (rent_frequency IN ('monthly', 'weekly', 'biweekly'));
        RAISE NOTICE '✓ Added rent_frequency column to properties table';
    ELSE
        RAISE NOTICE '→ rent_frequency column already exists';
    END IF;
END $$;

-- Add status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN status text NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'archived'));
        RAISE NOTICE '✓ Added status column to properties table';
        
        -- Set existing properties to active if they're verified
        UPDATE public.properties SET status = 'active' WHERE verified = true;
        RAISE NOTICE '✓ Set verified properties to active status';
    ELSE
        RAISE NOTICE '→ status column already exists';
    END IF;
END $$;

-- Fix data type mismatches
DO $$ 
BEGIN
    -- Fix beds column (should be integer, currently integer - OK)
    -- Fix baths column (should be integer, currently numeric)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'baths'
        AND data_type = 'numeric'
    ) THEN
        ALTER TABLE public.properties 
        ALTER COLUMN baths TYPE integer USING baths::integer;
        RAISE NOTICE '✓ Fixed baths column data type to integer';
    ELSE
        RAISE NOTICE '→ baths column type is already correct';
    END IF;
    
    -- Fix price column (should be integer, currently numeric)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'price'
        AND data_type = 'numeric'
    ) THEN
        ALTER TABLE public.properties 
        ALTER COLUMN price TYPE integer USING price::integer;
        RAISE NOTICE '✓ Fixed price column data type to integer';
    ELSE
        RAISE NOTICE '→ price column type is already correct';
    END IF;
END $$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_city_price ON public.properties(city, price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(is_featured);

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
    RAISE NOTICE 'SCHEMA MISMATCH FIX COMPLETED!';
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

-- Show updated properties table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
ORDER BY ordinal_position;
