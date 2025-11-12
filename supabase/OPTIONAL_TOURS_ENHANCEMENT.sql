-- ================================================
-- OPTIONAL TOURS TABLE ENHANCEMENTS
-- ================================================
-- This script adds optional audit and tracking fields
-- to the tours table for better management and history
-- 
-- ⚠️ The core functionality works without these changes.
-- This is OPTIONAL and adds enhanced tracking features.
-- ================================================

-- Add updated_at timestamp for tracking changes
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add timezone field for proper scheduling
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add who cancelled the tour (for audit purposes)
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles(id);

-- Add cancellation reason
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS cancelled_reason text;

-- Add status history tracking (JSONB for flexibility)
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;

-- Add reminder settings
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Add meeting link for virtual tours
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS meeting_link text;

-- Add tour type (in-person, virtual, or both)
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS tour_type text DEFAULT 'in-person' 
  CHECK (tour_type IN ('in-person', 'virtual', 'flexible'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON public.tours(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tours_updated_at ON public.tours(updated_at);
CREATE INDEX IF NOT EXISTS idx_tours_cancelled_by ON public.tours(cancelled_by);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tours_landlord_status 
  ON public.tours(landlord_id, status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_tours_tenant_status 
  ON public.tours(tenant_id, status, scheduled_at DESC);

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_tours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at field
DROP TRIGGER IF EXISTS tours_updated_at_trigger ON public.tours;
CREATE TRIGGER tours_updated_at_trigger
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tours_updated_at();

-- Function to track status history
CREATE OR REPLACE FUNCTION track_tour_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object(
      'from_status', OLD.status,
      'to_status', NEW.status,
      'changed_at', now(),
      'changed_by', current_user
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track status changes
DROP TRIGGER IF EXISTS tours_status_history_trigger ON public.tours;
CREATE TRIGGER tours_status_history_trigger
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION track_tour_status_change();

-- Function to send tour reminders (24 hours before)
CREATE OR REPLACE FUNCTION get_tours_needing_reminder()
RETURNS TABLE (
  tour_id uuid,
  tenant_email text,
  landlord_email text,
  property_title text,
  scheduled_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tour_id,
    tp.email as tenant_email,
    lp.email as landlord_email,
    prop.title as property_title,
    t.scheduled_at
  FROM tours t
  JOIN profiles tp ON t.tenant_id = tp.id
  JOIN profiles lp ON t.landlord_id = lp.id
  JOIN properties prop ON t.property_id = prop.id
  WHERE t.status = 'confirmed'
    AND t.reminder_sent = false
    AND t.scheduled_at > now()
    AND t.scheduled_at <= now() + interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to mark tour as completed after scheduled time
CREATE OR REPLACE FUNCTION auto_complete_past_tours()
RETURNS void AS $$
BEGIN
  UPDATE tours
  SET status = 'completed',
      updated_at = now()
  WHERE status = 'confirmed'
    AND scheduled_at < now() - interval '2 hours'
    AND scheduled_at < now();
END;
$$ LANGUAGE plpgsql;

-- View for tour analytics
CREATE OR REPLACE VIEW tour_analytics AS
SELECT 
  date_trunc('day', scheduled_at) as tour_date,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  COUNT(DISTINCT landlord_id) as unique_landlords,
  AVG(EXTRACT(epoch FROM (updated_at - created_at))/3600) as avg_hours_to_update
FROM tours
GROUP BY date_trunc('day', scheduled_at), status
ORDER BY tour_date DESC, status;

-- Grant necessary permissions
GRANT SELECT ON tour_analytics TO authenticated;

-- RLS policies remain the same
-- Tours are accessible by tenant or landlord

-- Comment the table for documentation
COMMENT ON TABLE public.tours IS 'Property tour scheduling and management';
COMMENT ON COLUMN public.tours.status IS 'Current status: requested, confirmed, completed, cancelled';
COMMENT ON COLUMN public.tours.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN public.tours.cancelled_by IS 'User who cancelled the tour';
COMMENT ON COLUMN public.tours.cancelled_reason IS 'Reason for cancellation';
COMMENT ON COLUMN public.tours.status_history IS 'JSON array of status changes';
COMMENT ON COLUMN public.tours.timezone IS 'Timezone for scheduled_at field';
COMMENT ON COLUMN public.tours.tour_type IS 'Type of tour: in-person, virtual, or flexible';
COMMENT ON COLUMN public.tours.meeting_link IS 'Video conference link for virtual tours';

-- Add helpful constraints
ALTER TABLE public.tours 
ADD CONSTRAINT tours_scheduled_at_future 
  CHECK (scheduled_at > created_at);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Tours table enhancements applied successfully!';
  RAISE NOTICE 'New features:';
  RAISE NOTICE '  - Audit tracking with updated_at';
  RAISE NOTICE '  - Status history logging';
  RAISE NOTICE '  - Cancellation tracking';
  RAISE NOTICE '  - Virtual tour support';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '  - Analytics view';
END $$;
