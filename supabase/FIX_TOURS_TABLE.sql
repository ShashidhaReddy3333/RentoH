-- ================================================================
-- FIX TOURS TABLE SCHEMA
-- ================================================================
-- Ensures tours table has correct status constraints for approval/decline
-- Safe to run - will not delete data
-- ================================================================

-- Update status column constraints to include new statuses
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.tours 
    DROP CONSTRAINT IF EXISTS tours_status_check;
    
    -- Add updated constraint with new statuses
    ALTER TABLE public.tours 
    ADD CONSTRAINT tours_status_check 
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'rescheduled'));
    
    RAISE NOTICE '✓ Updated status check constraint for tours table';
END $$;

-- Ensure timezone column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tours'
          AND column_name = 'timezone'
    ) THEN
        ALTER TABLE public.tours
        ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
        RAISE NOTICE '✓ Added timezone column to tours table';
    ELSE
        RAISE NOTICE '→ timezone column already exists';
    END IF;
END $$;

-- Ensure cancelled_reason column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tours'
          AND column_name = 'cancelled_reason'
    ) THEN
        ALTER TABLE public.tours
        ADD COLUMN cancelled_reason text;
        RAISE NOTICE '✓ Added cancelled_reason column to tours table';
    ELSE
        RAISE NOTICE '→ cancelled_reason column already exists';
    END IF;
END $$;

-- Ensure cancelled_by column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tours'
          AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE public.tours
        ADD COLUMN cancelled_by uuid REFERENCES public.profiles(id);
        RAISE NOTICE '✓ Added cancelled_by column to tours table';
    ELSE
        RAISE NOTICE '→ cancelled_by column already exists';
    END IF;
END $$;

-- Ensure completed_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tours'
          AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.tours
        ADD COLUMN completed_at timestamptz;
        RAISE NOTICE '✓ Added completed_at column to tours table';
    ELSE
        RAISE NOTICE '→ completed_at column already exists';
    END IF;
END $$;

-- Ensure updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tours'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.tours
        ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
        RAISE NOTICE '✓ Added updated_at column to tours table';
    ELSE
        RAISE NOTICE '→ updated_at column already exists';
    END IF;
END $$;

-- Verify the tours table structure
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    expected_columns TEXT[] := ARRAY[
        'id', 'property_id', 'tenant_id', 'landlord_id', 'scheduled_at', 
        'status', 'timezone', 'notes', 'cancelled_reason', 'cancelled_by', 'completed_at', 'created_at', 'updated_at'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY expected_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tours' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TOURS TABLE FIX COMPLETED!';
    RAISE NOTICE '========================================';
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✓✓✓ SUCCESS ✓✓✓';
        RAISE NOTICE 'All required columns are present in tours table!';
        RAISE NOTICE 'Tour approval/decline functionality should work correctly.';
    ELSE
        RAISE NOTICE '⚠ WARNING: Some columns are still missing:';
        FOREACH col IN ARRAY missing_columns
        LOOP
            RAISE NOTICE '  ✗ %', col;
        END LOOP;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show current tours table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tours'
ORDER BY ordinal_position;
