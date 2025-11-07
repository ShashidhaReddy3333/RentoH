-- Migration: Add missing 'notes' column to tours table
-- Date: 2025-01-07
-- Description: The tour request action passes a 'notes' field but the tours table doesn't have this column

-- Add notes column to tours table
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS notes text;

-- Create index for better performance on tour queries
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON public.tours(scheduled_at);

-- Add comment for documentation
COMMENT ON COLUMN public.tours.notes IS 'Optional notes from tenant when requesting a tour';
