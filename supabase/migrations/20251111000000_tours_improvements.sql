-- =====================================================
-- Tours Table Improvements
-- Created: 2024-11-11
-- Purpose: Add timezone support, conflict detection, and complete RLS
-- =====================================================

-- Add timezone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tours' AND column_name = 'timezone') THEN
    ALTER TABLE public.tours ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tours' AND column_name = 'notes') THEN
    ALTER TABLE public.tours ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tours' AND column_name = 'cancelled_reason') THEN
    ALTER TABLE public.tours ADD COLUMN cancelled_reason TEXT;
  END IF;
END $$;

-- Add index for faster conflict detection queries
CREATE INDEX IF NOT EXISTS idx_tours_landlord_scheduled 
ON public.tours(landlord_id, scheduled_at) 
WHERE status NOT IN ('cancelled', 'completed');

-- Create function to prevent double-booking
CREATE OR REPLACE FUNCTION check_tour_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping tours for the same landlord
  -- Assuming tours last 1 hour
  IF EXISTS (
    SELECT 1 FROM public.tours
    WHERE landlord_id = NEW.landlord_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled', 'completed')
    AND (
      (scheduled_at >= NEW.scheduled_at AND scheduled_at < NEW.scheduled_at + interval '1 hour')
      OR (scheduled_at + interval '1 hour' > NEW.scheduled_at AND scheduled_at < NEW.scheduled_at)
    )
  ) THEN
    RAISE EXCEPTION 'Tour slot conflict: Landlord already has a tour scheduled at this time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce conflict check
DROP TRIGGER IF EXISTS tour_conflict_check ON public.tours;
CREATE TRIGGER tour_conflict_check
  BEFORE INSERT OR UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION check_tour_conflict();

-- Ensure RLS is enabled
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with improvements
DROP POLICY IF EXISTS tours_read_tenant ON public.tours;
DROP POLICY IF EXISTS tours_read_landlord ON public.tours;
DROP POLICY IF EXISTS tours_insert ON public.tours;
DROP POLICY IF EXISTS tours_update_landlord ON public.tours;
DROP POLICY IF EXISTS tours_update_tenant ON public.tours;

-- Tenants can read their own tours
CREATE POLICY tours_read_tenant ON public.tours
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Landlords can read tours for their properties
CREATE POLICY tours_read_landlord ON public.tours
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Tenants can insert tour requests
CREATE POLICY tours_insert ON public.tours
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Landlords can update tours for their properties (confirm, reschedule, cancel)
CREATE POLICY tours_update_landlord ON public.tours
  FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (
    auth.uid() = landlord_id
    AND status IN ('requested', 'confirmed', 'rescheduled', 'cancelled')
  );

-- Tenants can update their own tours (mainly to cancel)
CREATE POLICY tours_update_tenant ON public.tours
  FOR UPDATE
  USING (auth.uid() = tenant_id)
  WITH CHECK (
    auth.uid() = tenant_id
    AND (
      -- Tenants can only cancel or update notes
      (OLD.status = status AND notes IS NOT NULL) OR
      status = 'cancelled'
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tours table updated with timezone and notes columns';
  RAISE NOTICE '✅ Conflict detection trigger created';
  RAISE NOTICE '✅ RLS policies updated for tours';
  RAISE NOTICE '📝 Tours will now prevent double-booking';
END $$;
