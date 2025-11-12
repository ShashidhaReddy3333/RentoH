-- ============================================================================
-- RentoH Recommended Schema Updates
-- ============================================================================
-- This file contains optional schema enhancements for new features
-- Run these migrations in the Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Property Comparison Tracking (Optional)
-- ----------------------------------------------------------------------------
-- Tracks which properties users are comparing
-- Useful for analytics and personalized recommendations

CREATE TABLE IF NOT EXISTS public.property_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_ids UUID[] NOT NULL CHECK (array_length(property_ids, 1) <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_comparisons_user 
  ON public.property_comparisons(user_id);

-- RLS Policies
ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own comparisons"
  ON public.property_comparisons
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. Search History Tracking (Optional)
-- ----------------------------------------------------------------------------
-- Tracks user search queries for analytics and saved searches feature

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  result_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user 
  ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created 
  ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query 
  ON public.search_history USING gin(to_tsvector('english', query));

-- RLS Policies
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
  ON public.search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
  ON public.search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Property Analytics Enhancement (Optional)
-- ----------------------------------------------------------------------------
-- Add analytics columns to track property engagement

ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comparison_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Create index for popular properties
CREATE INDEX IF NOT EXISTS idx_properties_view_count 
  ON public.properties(view_count DESC);

-- ----------------------------------------------------------------------------
-- 4. Saved Searches (Future Feature)
-- ----------------------------------------------------------------------------
-- Allows users to save search criteria and receive email alerts

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  min_price INTEGER,
  max_price INTEGER,
  beds INTEGER,
  baths INTEGER,
  property_type TEXT,
  pets BOOLEAN DEFAULT false,
  furnished BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  email_alerts BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily', 'weekly', 'instant')),
  last_alert_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user 
  ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts 
  ON public.saved_searches(email_alerts, last_alert_sent_at) 
  WHERE email_alerts = true;

-- RLS Policies
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved searches"
  ON public.saved_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Property Reviews & Ratings (Future Feature)
-- ----------------------------------------------------------------------------
-- Allows tenants to review properties and landlords

CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT,
  landlord_rating INTEGER CHECK (landlord_rating >= 1 AND landlord_rating <= 5),
  maintenance_rating INTEGER CHECK (maintenance_rating >= 1 AND maintenance_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, reviewer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_reviews_property 
  ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_rating 
  ON public.property_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_property_reviews_verified 
  ON public.property_reviews(is_verified) 
  WHERE is_verified = true;

-- RLS Policies
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified reviews"
  ON public.property_reviews
  FOR SELECT
  USING (is_verified = true OR auth.uid() = reviewer_id);

CREATE POLICY "Authenticated users can create reviews"
  ON public.property_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON public.property_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ----------------------------------------------------------------------------
-- 6. Property View Tracking Function
-- ----------------------------------------------------------------------------
-- Automatically increment view count when property is viewed

CREATE OR REPLACE FUNCTION increment_property_view_count(property_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = property_uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_property_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_property_view_count(UUID) TO anon;

-- ----------------------------------------------------------------------------
-- 7. Update Favorite Count Trigger
-- ----------------------------------------------------------------------------
-- Automatically update favorite count when favorites are added/removed

CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.properties
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.properties
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.property_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger (only if favorites table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    DROP TRIGGER IF EXISTS favorites_count_trigger ON public.favorites;
    CREATE TRIGGER favorites_count_trigger
      AFTER INSERT OR DELETE ON public.favorites
      FOR EACH ROW
      EXECUTE FUNCTION update_favorite_count();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. Updated Timestamp Triggers
-- ----------------------------------------------------------------------------
-- Automatically update the updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to relevant tables
DO $$ 
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    INNER JOIN information_schema.columns c 
      ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
      AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Property Search Function (Full-Text Search)
-- ----------------------------------------------------------------------------
-- Enables fast full-text search across properties

CREATE OR REPLACE FUNCTION search_properties(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price INTEGER,
  city TEXT,
  rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.city,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.description, '') || ' ' || p.city),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.properties p
  WHERE 
    to_tsvector('english', p.title || ' ' || COALESCE(p.description, '') || ' ' || p.city) @@ 
    plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_properties(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_properties(TEXT, INTEGER, INTEGER) TO anon;

-- ----------------------------------------------------------------------------
-- 10. Cleanup Old Search History (Scheduled Job)
-- ----------------------------------------------------------------------------
-- Run this periodically to keep search_history table size manageable

CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_search_history() TO authenticated;

-- Note: Set up a cron job in Supabase to run this weekly:
-- SELECT cron.schedule('cleanup-search-history', '0 0 * * 0', 'SELECT cleanup_old_search_history()');

-- ============================================================================
-- END OF SCHEMA UPDATES
-- ============================================================================

-- Usage Examples:
-- ---------------
-- 1. Track a property view:
--    SELECT increment_property_view_count('property-uuid-here');
--
-- 2. Search properties:
--    SELECT * FROM search_properties('waterloo 2 bedroom');
--
-- 3. Get popular properties:
--    SELECT * FROM properties ORDER BY view_count DESC LIMIT 10;
--
-- 4. Get trending properties:
--    SELECT * FROM properties 
--    WHERE last_viewed_at > NOW() - INTERVAL '7 days'
--    ORDER BY view_count DESC 
--    LIMIT 10;
