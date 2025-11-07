# Remaining Tasks & Database Configuration

## Quick Reference

The main code fixes have been implemented. The remaining tasks are primarily **data verification** and **configuration** rather than code changes.

---

## Task 1: Verify Property landlord_id

**Issue:** Tour scheduling and applications require properties to have a valid `landlord_id`.

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT id, title, landlord_id 
FROM properties 
WHERE landlord_id IS NULL 
LIMIT 10;
```

**Fix (if needed):**
```sql
-- Get the landlord account ID
SELECT id, email FROM profiles WHERE email = 'shashidharreddy3333@gmail.com';

-- Update properties without landlord_id (replace 'LANDLORD_UUID' with actual ID)
UPDATE properties 
SET landlord_id = 'LANDLORD_UUID'
WHERE landlord_id IS NULL;
```

**Alternative:** When creating new listings via the app, the `landlord_id` is automatically set from the authenticated user's session.

---

## Task 2: Verify Message Thread unread_count Column

**Issue:** Dashboard unread message counts may not work if the column is missing.

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'message_threads'
AND column_name = 'unread_count';
```

**Fix (if needed):**
```sql
-- Add unread_count column
ALTER TABLE message_threads
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Initialize existing threads
UPDATE message_threads
SET unread_count = 0
WHERE unread_count IS NULL;
```

**Better Approach:** Implement a database trigger to increment `unread_count` when a new message is inserted:

```sql
-- Create function to update unread count
CREATE OR REPLACE FUNCTION update_thread_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update thread metadata
  UPDATE message_threads
  SET 
    updated_at = NEW.created_at,
    last_message = LEFT(NEW.body, 100),
    -- Increment unread count for the recipient
    unread_count = CASE 
      WHEN NEW.sender_id = tenant_id THEN unread_count -- sender is tenant, don't count for tenant
      WHEN NEW.sender_id = landlord_id THEN unread_count -- sender is landlord, don't count for landlord
      ELSE unread_count + 1 -- recipient should see +1
    END
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_new_message();
```

**Mark thread as read function:**
```sql
-- Function for user to mark thread as read
CREATE OR REPLACE FUNCTION mark_thread_read(thread_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE message_threads
  SET unread_count = 0
  WHERE id = thread_uuid
  AND (tenant_id = user_uuid OR landlord_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Task 3: Verify Row Level Security (RLS) Policies

**Check Applications Table:**
```sql
-- View existing policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'applications';
```

**Expected Policies:**
1. Tenants can INSERT their own applications
2. Tenants can SELECT their own applications
3. Landlords can SELECT applications for their properties
4. Landlords can UPDATE status of applications for their properties

**Example Policies (adjust as needed):**

```sql
-- Policy: Tenants can insert applications
CREATE POLICY "Tenants can create applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = tenant_id
);

-- Policy: Tenants can view their applications
CREATE POLICY "Tenants can view their applications"
ON applications FOR SELECT
TO authenticated
USING (
  auth.uid() = tenant_id
);

-- Policy: Landlords can view applications for their properties
CREATE POLICY "Landlords can view applications for their properties"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = applications.property_id
    AND properties.landlord_id = auth.uid()
  )
);

-- Policy: Landlords can update application status
CREATE POLICY "Landlords can update application status"
ON applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = applications.property_id
    AND properties.landlord_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = applications.property_id
    AND properties.landlord_id = auth.uid()
  )
);
```

**Check Tours Table (similar policies needed):**

```sql
-- Tenants can insert tour requests
CREATE POLICY "Tenants can request tours"
ON tours FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = tenant_id
);

-- Tenants can view their tour requests
CREATE POLICY "Tenants can view their tours"
ON tours FOR SELECT
TO authenticated
USING (
  auth.uid() = tenant_id
);

-- Landlords can view tours for their properties
CREATE POLICY "Landlords can view tours for their properties"
ON tours FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = tours.property_id
    AND properties.landlord_id = auth.uid()
  )
);

-- Landlords can update tour status
CREATE POLICY "Landlords can update tour status"
ON tours FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = tours.property_id
    AND properties.landlord_id = auth.uid()
  )
);
```

**Check Favorites Table:**

```sql
-- Users can insert their own favorites
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Users can view their favorites
CREATE POLICY "Users can view their favorites"
ON favorites FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Users can delete their favorites
CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);
```

---

## Task 4: Test with Real Accounts

**Landlord Account:** shashidharreddy3333@gmail.com / Shashi@0203

1. Sign in as landlord
2. Create a new listing (verify landlord_id is set automatically)
3. View dashboard (check counts)
4. Navigate to applications (should show any tenant applications)
5. Navigate to scheduled tours (should show any tour requests)
6. Check messages (should show threads with unread counts)

**Tenant Account:** shashidharreddy3827@gmail.com / Shashi@0203

1. Sign in as tenant
2. Browse listings
3. Add listing to favorites (check both grid and property page)
4. Apply for a listing (verify form submission and redirect)
5. Request a tour (verify form appears and submission works)
6. Message landlord (verify thread creation and messaging)
7. View dashboard (check all counts)

---

## Task 5: Monitor for Errors

**Check Supabase Logs:**
1. Go to Supabase Dashboard > Logs
2. Filter by "Database" to see RLS denials
3. Filter by "API" to see failed requests
4. Look for 403 (Forbidden) or 500 errors

**Common Issues:**
- **403 on applications/tours:** Missing or incorrect RLS policies
- **Landlord sees 0 applications:** Property `landlord_id` not set or RLS blocking
- **Unread count not updating:** Trigger not installed or column missing
- **Tour button disabled:** Property missing `landlord_id`

---

## Task 6: Optional Enhancements

### Enhanced Messaging with Shift+Enter

**Current:** Single-line input  
**Improvement:** Multi-line textarea with Shift+Enter for newlines

**Code Change (in message input component):**

```typescript
// Replace <input> with <textarea> and add key handler
<textarea
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }}
  rows={3}
  placeholder="Type your message... (Shift+Enter for new line)"
  className="..."
/>
```

### Consistent Favorite Icon Color

**Current:** Toggles between teal (unsaved) and red (saved)  
**Improvement:** Single color with filled/outline states

**Code Change:**

```typescript
// In FavoriteButton.tsx
<HeartIcon 
  className={`h-5 w-5 transition ${
    saved 
      ? 'fill-brand-teal text-brand-teal' 
      : 'fill-none text-brand-teal stroke-2'
  }`}
  aria-hidden="true"
/>
```

### Add Skip Navigation Link

**Improvement:** Accessibility for keyboard users

```typescript
// In main layout
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
>
  Skip to main content
</a>

<main id="main-content">
  {children}
</main>
```

---

## Summary

### Code Changes Already Made ✅
1. Listing form validation feedback
2. Favorite button on property details page
3. Flexible FavoriteButton component
4. isFavorited function in data access layer

### Configuration Needed ⚙️
1. Verify/set `landlord_id` on all properties
2. Add `unread_count` column to message_threads
3. Create database trigger for message counts
4. Verify/create RLS policies for applications, tours, favorites

### Testing Required 🧪
1. Sign in as both landlord and tenant
2. Test full workflow for each role
3. Verify dashboard counts update
4. Check Supabase logs for errors
5. Run Lighthouse accessibility audit

### Optional Enhancements 💡
1. Multi-line message input with Shift+Enter
2. Consistent favorite icon color
3. Skip navigation link for accessibility
4. Real-time message updates (Supabase Realtime)

---

**Priority Order:**
1. ⚙️ Configuration (Tasks 1-3)
2. 🧪 Testing (Task 4-5)
3. 💡 Enhancements (Task 6)

All code-level fixes have been implemented. The remaining work is primarily database configuration and testing to ensure the backend supports the frontend features correctly.
