-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Properties Policies
CREATE POLICY "Public properties are viewable by everyone"
ON properties FOR SELECT
USING (status = 'active');

CREATE POLICY "Landlords can manage their own properties"
ON properties FOR ALL
USING (landlord_id = auth.uid())
WITH CHECK (landlord_id = auth.uid());

-- Message Threads Policies
CREATE POLICY "Users can view threads they participate in"
ON message_threads FOR SELECT
USING (
  tenant_id = auth.uid() OR 
  landlord_id = auth.uid()
);

CREATE POLICY "Thread owners can update their threads"
ON message_threads FOR UPDATE
USING (landlord_id = auth.uid())
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Users can create threads with themselves as owner"
ON message_threads FOR INSERT
WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their threads"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (
      tenant_id = auth.uid() OR
      landlord_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can send messages in their threads"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (
      tenant_id = auth.uid() OR
      landlord_id = auth.uid()
    )
  )
);

-- Favorites Policies
CREATE POLICY "Users can manage their own favorites"
ON favorites FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure users can only select their own user data
CREATE POLICY "Users can only view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create functions for role-based access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_landlord()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' = 'landlord'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for admin access
CREATE POLICY "Admins have full access to all tables"
ON properties FOR ALL
USING (is_admin());

-- Add policy for landlord-specific features
CREATE POLICY "Only landlords can create properties"
ON properties FOR INSERT
WITH CHECK (is_landlord());
