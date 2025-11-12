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

-- Verify the tours table structure
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    expected_columns TEXT[] := ARRAY[
        'id', 'property_id', 'tenant_id', 'landlord_id', 'scheduled_at', 
        'status', 'notes', 'created_at'
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
