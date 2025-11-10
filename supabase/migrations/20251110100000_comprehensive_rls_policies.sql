-- =====================================================
-- Comprehensive RLS Policies for Rento Application
-- Created: 2024-11-10
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROPERTIES TABLE POLICIES
-- =====================================================

-- Anyone can read published properties
DROP POLICY IF EXISTS properties_read_public ON public.properties;
CREATE POLICY properties_read_public ON public.properties
  FOR SELECT
  USING (status = 'published' OR status = 'active');

-- Landlords can read their own properties (including drafts)
DROP POLICY IF EXISTS properties_read_own ON public.properties;
CREATE POLICY properties_read_own ON public.properties
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Landlords can insert properties
DROP POLICY IF EXISTS properties_insert ON public.properties;
CREATE POLICY properties_insert ON public.properties
  FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

-- Landlords can update their own properties
DROP POLICY IF EXISTS properties_update ON public.properties;
CREATE POLICY properties_update ON public.properties
  FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- Landlords can delete their own properties
DROP POLICY IF EXISTS properties_delete ON public.properties;
CREATE POLICY properties_delete ON public.properties
  FOR DELETE
  USING (auth.uid() = landlord_id);

-- =====================================================
-- FAVORITES TABLE POLICIES
-- =====================================================

-- Users can read their own favorites
DROP POLICY IF EXISTS favorites_read_own ON public.favorites;
CREATE POLICY favorites_read_own ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
DROP POLICY IF EXISTS favorites_insert ON public.favorites;
CREATE POLICY favorites_insert ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
DROP POLICY IF EXISTS favorites_delete ON public.favorites;
CREATE POLICY favorites_delete ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- APPLICATIONS TABLE POLICIES
-- =====================================================

-- Tenants can read their own applications
DROP POLICY IF EXISTS apps_read_tenant ON public.applications;
CREATE POLICY apps_read_tenant ON public.applications
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Landlords can read applications for their properties
DROP POLICY IF EXISTS apps_read_landlord ON public.applications;
CREATE POLICY apps_read_landlord ON public.applications
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Tenants can insert applications
DROP POLICY IF EXISTS apps_insert ON public.applications;
CREATE POLICY apps_insert ON public.applications
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Landlords can update applications for their properties
DROP POLICY IF EXISTS apps_update_landlord ON public.applications;
CREATE POLICY apps_update_landlord ON public.applications
  FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- =====================================================
-- TOURS TABLE POLICIES
-- =====================================================

-- Tenants can read their own tours
DROP POLICY IF EXISTS tours_read_tenant ON public.tours;
CREATE POLICY tours_read_tenant ON public.tours
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Landlords can read tours for their properties
DROP POLICY IF EXISTS tours_read_landlord ON public.tours;
CREATE POLICY tours_read_landlord ON public.tours
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Tenants can insert tour requests
DROP POLICY IF EXISTS tours_insert ON public.tours;
CREATE POLICY tours_insert ON public.tours
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Landlords can update tours for their properties
DROP POLICY IF EXISTS tours_update_landlord ON public.tours;
CREATE POLICY tours_update_landlord ON public.tours
  FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- Tenants can update their own tours (e.g., cancel)
DROP POLICY IF EXISTS tours_update_tenant ON public.tours;
CREATE POLICY tours_update_tenant ON public.tours
  FOR UPDATE
  USING (auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = tenant_id);

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Users can read messages in their threads
DROP POLICY IF EXISTS messages_read_participant ON public.messages;
CREATE POLICY messages_read_participant ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = messages.thread_id
      AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
    )
  );

-- Users can insert messages in their threads
DROP POLICY IF EXISTS messages_insert_participant ON public.messages;
CREATE POLICY messages_insert_participant ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = messages.thread_id
      AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
    )
  );

-- =====================================================
-- MESSAGE_THREADS TABLE POLICIES
-- =====================================================

-- Tenants can read their own threads
DROP POLICY IF EXISTS threads_read_tenant ON public.message_threads;
CREATE POLICY threads_read_tenant ON public.message_threads
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Landlords can read their threads
DROP POLICY IF EXISTS threads_read_landlord ON public.message_threads;
CREATE POLICY threads_read_landlord ON public.message_threads
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Tenants can create threads
DROP POLICY IF EXISTS threads_insert_tenant ON public.message_threads;
CREATE POLICY threads_insert_tenant ON public.message_threads
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Participants can update threads (e.g., mark as read)
DROP POLICY IF EXISTS threads_update_participant ON public.message_threads;
CREATE POLICY threads_update_participant ON public.message_threads
  FOR UPDATE
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can read their own profile
DROP POLICY IF EXISTS profiles_read_own ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can read profiles of people they interact with
DROP POLICY IF EXISTS profiles_read_contacts ON public.profiles;
CREATE POLICY profiles_read_contacts ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE (t.tenant_id = auth.uid() AND t.landlord_id = profiles.id)
         OR (t.landlord_id = auth.uid() AND t.tenant_id = profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE (a.tenant_id = auth.uid() AND a.landlord_id = profiles.id)
         OR (a.landlord_id = auth.uid() AND a.tenant_id = profiles.id)
    )
  );

-- Users can insert their own profile
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that RLS is enabled on all tables
DO $$
DECLARE
    table_name text;
    rls_enabled boolean;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['properties', 'favorites', 'applications', 'tours', 'messages', 'message_threads', 'profiles'])
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name
        AND relnamespace = 'public'::regnamespace;
        
        IF rls_enabled THEN
            RAISE NOTICE '✅ RLS enabled on %', table_name;
        ELSE
            RAISE WARNING '❌ RLS NOT enabled on %', table_name;
        END IF;
    END LOOP;
END $$;
