-- =========================================================
-- RentoH database setup script (idempotent)
-- Run in Supabase SQL editor to ensure tables, policies, and storage exist.
-- =========================================================

-- Extensions
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'btree_gist' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION btree_gist SET SCHEMA extensions;
  END IF;
END$$;

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  EXCEPTION
    WHEN insufficient_privilege OR undefined_file THEN
      NULL;
  END;
END$$;

-- Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  role text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{"newMatches":true,"messages":true,"applicationUpdates":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price integer NOT NULL,
  beds integer NOT NULL DEFAULT 0,
  baths integer NOT NULL DEFAULT 0,
  area integer,
  type text NOT NULL CHECK (type IN ('apartment', 'condo', 'house', 'townhouse')),
  address text,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  neighborhood text,
  images text[] NOT NULL DEFAULT '{}',
  amenities text[] NOT NULL DEFAULT '{}',
  pets boolean NOT NULL DEFAULT false,
  smoking boolean NOT NULL DEFAULT false,
  parking text,
  rent_frequency text NOT NULL DEFAULT 'monthly' CHECK (rent_frequency IN ('monthly', 'weekly', 'biweekly')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  verified boolean NOT NULL DEFAULT false,
  furnished boolean NOT NULL DEFAULT false,
  available_from date,
  is_featured boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  walk_score integer,
  transit_score integer,
  walkthrough_video_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_city_price ON public.properties(city, price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(is_featured);

CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text,
  last_message text,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON public.message_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.message_threads(tenant_id, landlord_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON public.messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewing', 'interview', 'approved', 'rejected')),
  submitted_at timestamptz,
  message text,
  monthly_income integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_property ON public.applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON public.applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_landlord ON public.applications(landlord_id);

CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tours_property ON public.tours(property_id);
CREATE INDEX IF NOT EXISTS idx_tours_tenant ON public.tours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tours_landlord ON public.tours(landlord_id);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications jsonb NOT NULL DEFAULT '{"newMessages":true,"applications":true,"tours":true}'::jsonb,
  sms_notifications jsonb NOT NULL DEFAULT '{"newMessages":false,"applications":false,"tours":false}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS profiles_read ON public.profiles;
DROP POLICY IF EXISTS profiles_upsert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_read ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_upsert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Properties policies
DROP POLICY IF EXISTS properties_read ON public.properties;
DROP POLICY IF EXISTS properties_read_public ON public.properties;
DROP POLICY IF EXISTS properties_read_owner ON public.properties;
DROP POLICY IF EXISTS properties_insert ON public.properties;
DROP POLICY IF EXISTS properties_update ON public.properties;
DROP POLICY IF EXISTS properties_delete ON public.properties;

CREATE POLICY properties_read_public ON public.properties
  FOR SELECT USING (
    status = 'active'
    AND (verified IS TRUE OR is_verified IS TRUE)
  );

CREATE POLICY properties_read_owner ON public.properties
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY properties_insert ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY properties_update ON public.properties
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY properties_delete ON public.properties
  FOR DELETE USING (auth.uid() = landlord_id);

-- Message thread policies
DROP POLICY IF EXISTS threads_read ON public.message_threads;
DROP POLICY IF EXISTS threads_insert ON public.message_threads;
DROP POLICY IF EXISTS threads_update ON public.message_threads;

CREATE POLICY threads_read ON public.message_threads
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY threads_insert ON public.message_threads
  FOR INSERT WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY threads_update ON public.message_threads
  FOR UPDATE USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Message policies
DROP POLICY IF EXISTS messages_read ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;

CREATE POLICY messages_read ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (auth.uid() = t.tenant_id OR auth.uid() = t.landlord_id)
    )
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (auth.uid() = t.tenant_id OR auth.uid() = t.landlord_id)
    )
  );

-- Favorites policies
DROP POLICY IF EXISTS fav_read ON public.favorites;
DROP POLICY IF EXISTS fav_write_ins ON public.favorites;
DROP POLICY IF EXISTS fav_write_upd ON public.favorites;
DROP POLICY IF EXISTS fav_write_del ON public.favorites;

CREATE POLICY fav_read ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY fav_write_ins ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY fav_write_upd ON public.favorites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY fav_write_del ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Saved properties policies
DROP POLICY IF EXISTS saved_read ON public.saved_properties;
DROP POLICY IF EXISTS saved_write_ins ON public.saved_properties;
DROP POLICY IF EXISTS saved_write_del ON public.saved_properties;

CREATE POLICY saved_read ON public.saved_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY saved_write_ins ON public.saved_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY saved_write_del ON public.saved_properties
  FOR DELETE USING (auth.uid() = user_id);

-- Applications policies
DROP POLICY IF EXISTS apps_read_self ON public.applications;
DROP POLICY IF EXISTS apps_read_landlord ON public.applications;
DROP POLICY IF EXISTS apps_insert ON public.applications;

CREATE POLICY apps_read_self ON public.applications
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY apps_read_landlord ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY apps_insert ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Tours policies
DROP POLICY IF EXISTS tours_read_self ON public.tours;
DROP POLICY IF EXISTS tours_read_landlord ON public.tours;
DROP POLICY IF EXISTS tours_insert ON public.tours;

CREATE POLICY tours_read_self ON public.tours
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY tours_read_landlord ON public.tours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY tours_insert ON public.tours
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- User preferences policies
DROP POLICY IF EXISTS prefs_read ON public.user_preferences;
DROP POLICY IF EXISTS prefs_upsert ON public.user_preferences;
DROP POLICY IF EXISTS prefs_update ON public.user_preferences;

CREATE POLICY prefs_read ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prefs_upsert ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY prefs_update ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket and policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'listings') THEN
    BEGIN
      PERFORM storage.create_bucket('listings', true);
    EXCEPTION
      WHEN undefined_function THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true);
    END;
  END IF;
END
$$;

DROP POLICY IF EXISTS storage_listings_read ON storage.objects;
DROP POLICY IF EXISTS storage_listings_insert ON storage.objects;
DROP POLICY IF EXISTS storage_listings_update ON storage.objects;
DROP POLICY IF EXISTS storage_listings_delete ON storage.objects;

CREATE POLICY storage_listings_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'listings');

CREATE POLICY storage_listings_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listings'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY storage_listings_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listings'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY storage_listings_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'listings'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Trigger on auth.users for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      ''
    ),
    COALESCE(
      NULLIF(NEW.raw_app_meta_data->>'role', ''),
      NULLIF(NEW.raw_user_meta_data->>'role', ''),
      'tenant'
    )
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
