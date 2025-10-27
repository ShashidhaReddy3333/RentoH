-- RentoH Database RESET and Setup Script
-- This will DROP all existing tables and recreate them from scratch
-- ⚠️ WARNING: This will DELETE ALL DATA in these tables!

-- Drop all policies first (to avoid dependency issues)
-- Note: Using DO block to safely drop policies even if tables don't exist
DO $$ 
BEGIN
  -- Drop policies for profiles
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  
  -- Drop policies for properties
  DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
  DROP POLICY IF EXISTS "Landlords can create properties" ON public.properties;
  DROP POLICY IF EXISTS "Landlords can update own properties" ON public.properties;
  DROP POLICY IF EXISTS "Landlords can delete own properties" ON public.properties;
  
  -- Drop policies for applications
  DROP POLICY IF EXISTS "Tenants can create applications" ON public.applications;
  DROP POLICY IF EXISTS "Tenants can view own applications" ON public.applications;
  DROP POLICY IF EXISTS "Landlords can view applications for their properties" ON public.applications;
  DROP POLICY IF EXISTS "Landlords can update applications for their properties" ON public.applications;
  
  -- Drop policies for favorites
  DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
  
  -- Drop policies for message_threads
  DROP POLICY IF EXISTS "Users can view threads they participate in" ON public.message_threads;
  DROP POLICY IF EXISTS "Users can create threads" ON public.message_threads;
  
  -- Drop policies for messages
  DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;
  DROP POLICY IF EXISTS "Users can create messages in their threads" ON public.messages;
  
  -- Drop policies for tours
  DROP POLICY IF EXISTS "Tenants can manage own tours" ON public.tours;
  DROP POLICY IF EXISTS "Landlords can view tours for their properties" ON public.tours;
  DROP POLICY IF EXISTS "Landlords can update tours for their properties" ON public.tours;
  
  -- Drop policies for user_preferences
  DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Drop storage policies
DROP POLICY IF EXISTS "Public can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.tours CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_threads CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'listings';

-- Now recreate everything fresh

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE TABLES
-- ============================================

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- monthly rent in cents
  beds INTEGER NOT NULL,
  baths NUMERIC NOT NULL,
  area INTEGER, -- square feet
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'condo')),
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  pets_allowed BOOLEAN DEFAULT FALSE,
  furnished BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  available_from DATE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  move_in_date DATE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create message_threads table
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tours table
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'never')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_featured ON public.properties(is_featured);
CREATE INDEX idx_applications_property ON public.applications(property_id);
CREATE INDEX idx_applications_tenant ON public.applications(tenant_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_property ON public.favorites(property_id);
CREATE INDEX idx_threads_tenant ON public.message_threads(tenant_id);
CREATE INDEX idx_threads_landlord ON public.message_threads(landlord_id);
CREATE INDEX idx_messages_thread ON public.messages(thread_id);
CREATE INDEX idx_tours_property ON public.tours(property_id);
CREATE INDEX idx_tours_tenant ON public.tours(tenant_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for properties
CREATE POLICY "Properties are viewable by everyone" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Landlords can create properties" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = landlord_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('landlord', 'admin'))
  );

CREATE POLICY "Landlords can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = landlord_id);

-- Policies for applications
CREATE POLICY "Tenants can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view applications for their properties" ON public.applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND landlord_id = auth.uid())
  );

CREATE POLICY "Landlords can update applications for their properties" ON public.applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND landlord_id = auth.uid())
  );

-- Policies for favorites
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Policies for message_threads
CREATE POLICY "Users can view threads they participate in" ON public.message_threads
  FOR SELECT USING (auth.uid() IN (tenant_id, landlord_id));

CREATE POLICY "Users can create threads" ON public.message_threads
  FOR INSERT WITH CHECK (auth.uid() IN (tenant_id, landlord_id));

-- Policies for messages
CREATE POLICY "Users can view messages in their threads" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = thread_id AND auth.uid() IN (tenant_id, landlord_id)
    )
  );

CREATE POLICY "Users can create messages in their threads" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = thread_id AND auth.uid() IN (tenant_id, landlord_id)
    )
  );

-- Policies for tours
CREATE POLICY "Tenants can manage own tours" ON public.tours
  FOR ALL USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view tours for their properties" ON public.tours
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND landlord_id = auth.uid())
  );

CREATE POLICY "Landlords can update tours for their properties" ON public.tours
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND landlord_id = auth.uid())
  );

-- Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CREATE TRIGGER FUNCTION FOR NEW USERS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listings bucket
CREATE POLICY "Public can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own listing images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================
-- DONE!
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('profiles', 'properties', 'applications', 'favorites', 'message_threads', 'messages', 'tours', 'user_preferences')
ORDER BY table_name;
