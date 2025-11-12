-- ================================================================
-- FIX APPLICATIONS TABLE SCHEMA
-- ================================================================
-- Ensures applications table has all required columns
-- Safe to run - will not delete data
-- ================================================================

-- Add submitted_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'applications' 
        AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE public.applications 
        ADD COLUMN submitted_at timestamptz;
        RAISE NOTICE '✓ Added submitted_at column to applications table';
        
        -- Set submitted_at for existing applications
        UPDATE public.applications 
        SET submitted_at = created_at 
        WHERE submitted_at IS NULL AND status != 'draft';
        RAISE NOTICE '✓ Updated submitted_at for existing applications';
    ELSE
        RAISE NOTICE '→ submitted_at column already exists';
    END IF;
END $$;

-- Ensure status column has correct constraints
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.applications 
    DROP CONSTRAINT IF EXISTS applications_status_check;
    
    -- Add updated constraint
    ALTER TABLE public.applications 
    ADD CONSTRAINT applications_status_check 
    CHECK (status IN ('draft', 'submitted', 'reviewing', 'interview', 'approved', 'rejected'));
    
    RAISE NOTICE '✓ Updated status check constraint for applications table';
END $$;

-- Verify the applications table structure
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    expected_columns TEXT[] := ARRAY[
        'id', 'property_id', 'tenant_id', 'landlord_id', 'status', 
        'submitted_at', 'message', 'monthly_income', 'created_at'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'applications' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APPLICATIONS TABLE FIX COMPLETED!';
    RAISE NOTICE '========================================';
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✓✓✓ SUCCESS ✓✓✓';
        RAISE NOTICE 'All required columns are present in applications table!';
        RAISE NOTICE 'Apply Now functionality should work correctly.';
    ELSE
        RAISE NOTICE '⚠ WARNING: Some columns are still missing:';
        FOREACH col IN ARRAY missing_columns
        LOOP
            RAISE NOTICE '  ✗ %', col;
        END LOOP;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show current applications table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
ORDER BY ordinal_position;
