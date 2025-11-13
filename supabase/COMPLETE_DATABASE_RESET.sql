-- ================================================================
-- COMPLETE DATABASE RESET FOR RentoH
-- ================================================================
-- ⚠️ WARNING: This script will DELETE ALL DATA and rebuild the schema
-- ⚠️ Only run this if you're okay with losing all existing data
-- ================================================================
-- How to use:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and click "Run"
-- ================================================================

-- Step 1: Disable RLS temporarily for cleanup
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tours DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Drop all triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', 
            r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- Step 4: Drop all functions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE pg_namespace.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
            r.proname, r.args);
    END LOOP;
END $$;

-- Step 5: Drop all views
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.viewname);
    END LOOP;
END $$;

-- Step 6: Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_threads CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.tours CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.saved_properties CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 7: Drop any remaining types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.property_type CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.tour_status CASCADE;

-- ================================================================
-- RECREATE DATABASE SCHEMA
-- ================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
  full_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  city text,
  address text,
  contact_method text CHECK (contact_method IN ('email', 'phone', 'chat')),
  dob text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{"newMatches":true,"messages":true,"applicationUpdates":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  type text NOT NULL CHECK (type IN ('apartment', 'house', 'condo', 'townhouse')),
  price numeric NOT NULL CHECK (price >= 0),
  beds integer NOT NULL CHECK (beds >= 0),
  baths numeric NOT NULL CHECK (baths >= 0),
  sqft integer CHECK (sqft >= 0),
  address text NOT NULL,
  city text NOT NULL,
  state text,
  zip text,
  neighborhood text,
  coordinates jsonb,
  images text[] DEFAULT ARRAY[]::text[],
  amenities text[] DEFAULT ARRAY[]::text[],
  pets boolean DEFAULT false,
  furnished boolean DEFAULT false,
  available_from date,
  verified boolean DEFAULT false,
  view_count integer DEFAULT 0,
  favorite_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create message_threads table
CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  unread_by_tenant boolean DEFAULT false,
  unread_by_landlord boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

-- Create saved_properties table (alias for favorites)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewing', 'interview', 'accepted', 'approved', 'rejected')),
  first_name text,
  last_name text,
  email text,
  phone text,
  employment_status text,
  employer text,
  annual_income numeric,
  move_in_date date,
  additional_info text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  decision_at timestamptz,
  message text,
  notes text,
  monthly_income integer,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create tours table
CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  timezone text NOT NULL DEFAULT 'UTC',
  notes text,
  cancelled_reason text,
  cancelled_by uuid REFERENCES public.profiles(id),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications jsonb NOT NULL DEFAULT '{"newMessages":true,"applications":true,"tours":true}'::jsonb,
  sms_notifications jsonb NOT NULL DEFAULT '{"newMessages":false,"applications":false,"tours":false}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- CREATE INDEXES
-- ================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_beds ON public.properties(beds);
CREATE INDEX IF NOT EXISTS idx_properties_verified ON public.properties(verified);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);

-- Message threads indexes
CREATE INDEX IF NOT EXISTS idx_threads_property ON public.message_threads(property_id);
CREATE INDEX IF NOT EXISTS idx_threads_tenant ON public.message_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_threads_landlord ON public.message_threads(landlord_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON public.message_threads(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_property ON public.applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON public.applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_landlord ON public.applications(landlord_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Tours indexes
CREATE INDEX IF NOT EXISTS idx_tours_property ON public.tours(property_id);
CREATE INDEX IF NOT EXISTS idx_tours_tenant ON public.tours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tours_landlord ON public.tours(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tours_schedule ON public.tours(property_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tours_landlord ON public.tours(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled ON public.tours(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);

-- ================================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- CREATE RLS POLICIES
-- ================================================================

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Landlords can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete their own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = landlord_id);

-- Message threads policies
CREATE POLICY "Users can view their own threads"
  ON public.message_threads FOR SELECT
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Users can create threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Users can update their own threads"
  ON public.message_threads FOR UPDATE
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Messages policies
CREATE POLICY "Users can view messages in their threads"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE id = messages.thread_id
      AND (tenant_id = auth.uid() OR landlord_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE id = messages.thread_id
      AND (tenant_id = auth.uid() OR landlord_id = auth.uid())
    )
  );

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Saved properties policies (same as favorites)
CREATE POLICY "Users can view their own saved properties"
  ON public.saved_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add saved properties"
  ON public.saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved properties"
  ON public.saved_properties FOR DELETE
  USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY apps_read_self ON public.applications
  FOR SELECT USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY apps_insert_self ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY apps_update_landlord ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY apps_delete_self ON public.applications
  FOR DELETE USING (auth.uid() = tenant_id);

-- Tours policies
CREATE POLICY tours_read_participants ON public.tours
  FOR SELECT USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY tours_insert_self ON public.tours
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY tours_update_participants ON public.tours
  FOR UPDATE USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY tours_delete_participants ON public.tours
  FOR DELETE USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- RATE LIMITING & TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION public.prevent_duplicate_applications()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.tenant_id = NEW.tenant_id
      AND a.property_id = NEW.property_id
  ) THEN
    RAISE EXCEPTION 'duplicate_application' USING MESSAGE = 'Multiple applications are not allowed for this property.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_duplicate_applications_trg ON public.applications;
CREATE TRIGGER prevent_duplicate_applications_trg
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_applications();

CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.messages m
  WHERE m.sender_id = NEW.sender_id
    AND m.created_at >= now() - interval '60 seconds';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'message_rate_limit' USING MESSAGE = 'Too many messages sent in a single minute.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_rate_limit_trg ON public.messages;
CREATE TRIGGER message_rate_limit_trg
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

CREATE OR REPLACE FUNCTION public.ensure_tour_slot_available()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count integer;
  active_count integer;
BEGIN
  IF NEW.status IN ('cancelled', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO conflict_count
  FROM public.tours t
  WHERE t.property_id = NEW.property_id
    AND t.scheduled_at = NEW.scheduled_at
    AND t.status IN ('requested', 'confirmed', 'rescheduled')
    AND (TG_OP = 'INSERT' OR t.id <> NEW.id);

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'tour_slot_conflict' USING MESSAGE = 'Tour slot conflict: this time is already booked.';
  END IF;

  SELECT COUNT(*) INTO active_count
  FROM public.tours t
  WHERE t.tenant_id = NEW.tenant_id
    AND t.status IN ('requested', 'confirmed', 'rescheduled')
    AND t.scheduled_at >= now()
    AND (TG_OP = 'INSERT' OR t.id <> NEW.id);

  IF active_count >= 3 THEN
    RAISE EXCEPTION 'tour_rate_limit' USING MESSAGE = 'Too many upcoming tours. Please wait before scheduling another.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_tour_double_booking_trg ON public.tours;
CREATE TRIGGER prevent_tour_double_booking_trg
  BEFORE INSERT OR UPDATE OF scheduled_at, status ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tour_slot_available();

-- ================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update favorite count on properties
CREATE OR REPLACE FUNCTION update_property_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.properties
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.property_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.properties
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.property_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for favorite count
CREATE TRIGGER update_favorite_count_on_favorites
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION update_property_favorite_count();

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE RESET COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tables, policies, and functions have been recreated.';
  RAISE NOTICE 'You can now use your application with a clean database.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✓ profiles';
  RAISE NOTICE '  ✓ properties';
  RAISE NOTICE '  ✓ message_threads';
  RAISE NOTICE '  ✓ messages';
  RAISE NOTICE '  ✓ favorites';
  RAISE NOTICE '  ✓ saved_properties';
  RAISE NOTICE '  ✓ applications';
  RAISE NOTICE '  ✓ tours';
  RAISE NOTICE '  ✓ user_preferences';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Sign up with your test accounts';
  RAISE NOTICE '  2. Test the application functionality';
  RAISE NOTICE '  3. Add sample properties if needed';
  RAISE NOTICE '========================================';
END $$;
