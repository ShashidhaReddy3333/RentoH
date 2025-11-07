# 🔧 Tour Requests & Applications Fix Guide

## Problem Summary
Tour requests and applications are not working. This is likely due to one or more of these issues:
1. ❌ Properties missing `landlord_id` (most common)
2. ❌ Tours table missing `notes` column
3. ❌ No users with 'landlord' role
4. ❌ Authentication/RLS policy issues

---

## 🎯 Quick Fix (5 minutes)

### Step 1: Run Diagnostic Queries
Open Supabase SQL Editor and run the queries from `supabase/DIAGNOSE_ISSUES.sql`

**Key checks:**
```sql
-- Check if properties have landlord_id
SELECT COUNT(*) FROM properties WHERE landlord_id IS NULL;
-- If this returns > 0, that's your problem!

-- Check if tours table has notes column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'notes';
-- Should return 'notes'
```

### Step 2: Fix Missing Landlord IDs

#### Option A: If you have a landlord user
```sql
-- Find your landlord user
SELECT id, email, role FROM profiles WHERE role = 'landlord';

-- Update all properties with that landlord_id (replace with actual UUID)
UPDATE properties 
SET landlord_id = 'YOUR-LANDLORD-UUID-FROM-ABOVE' 
WHERE landlord_id IS NULL;
```

#### Option B: If you DON'T have a landlord user
```sql
-- Step 1: Sign up on your website with your email
-- Then run this to make yourself a landlord:
UPDATE profiles 
SET role = 'landlord' 
WHERE email = 'your-email@example.com';

-- Step 2: Get your new landlord ID
SELECT id FROM profiles WHERE email = 'your-email@example.com';

-- Step 3: Assign to properties (replace with actual UUID)
UPDATE properties 
SET landlord_id = 'YOUR-UUID-FROM-ABOVE' 
WHERE landlord_id IS NULL;
```

### Step 3: Add Notes Column to Tours
```sql
-- Run the migration
ALTER TABLE tours ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON tours(scheduled_at);
```

### Step 4: Verify Everything Works
```sql
-- All these should return TRUE
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'tours' AND column_name = 'notes') as has_notes,
    (SELECT COUNT(*) FROM properties WHERE landlord_id IS NULL) = 0 as all_have_landlord,
    EXISTS(SELECT 1 FROM profiles WHERE role = 'landlord') as has_landlord_user;
```

---

## 🧪 Testing After Fix

### Test 1: Tour Request
1. Go to any property page
2. Click "Request a tour"
3. Fill in date, time, and notes
4. Submit
5. ✅ Should see success message: "Tour request sent..."

### Test 2: Application
1. Go to any property page
2. Click "Apply now"
3. Fill in monthly income and message
4. Submit
5. ✅ Should redirect to `/applications` page

### Test 3: Verify Data in Database
```sql
-- Check recent tours
SELECT * FROM tours ORDER BY created_at DESC LIMIT 5;

-- Check recent applications
SELECT * FROM applications ORDER BY created_at DESC LIMIT 5;
```

---

## 🚨 Common Errors & Solutions

### Error: "Tour scheduling is unavailable for this listing"
**Cause:** Property has no `landlord_id`  
**Fix:** Run Step 2 above to assign landlord to properties

### Error: Column "notes" does not exist
**Cause:** Tours table missing notes column  
**Fix:** Run Step 3 above

### Error: "Sign in to request a tour"
**Cause:** User not authenticated  
**Fix:** Make sure user is signed in before requesting tour/application

### Error: "new row violates row-level security policy"
**Cause:** RLS policy blocking insert  
**Fix:** Verify user is authenticated and has correct role:
```sql
-- Check if RLS policies exist
SELECT policyname, cmd FROM pg_policies 
WHERE tablename IN ('tours', 'applications');

-- Should show:
-- tours_insert | INSERT
-- apps_insert | INSERT
```

### Error: Property page shows yellow warning banner
**Cause:** Property missing landlord_id  
**Fix:** That property needs a landlord assigned (Step 2)

---

## 📋 Root Cause Analysis

### Why This Happened

1. **Database Schema Evolution**
   - Tours table was created without `notes` column
   - Migration `20250107_fix_tours_schema.sql` adds it
   - Must be applied to production database

2. **Missing Foreign Keys**
   - Both `tours` and `applications` require `landlord_id`
   - Properties must have valid `landlord_id` to work
   - Sample data may have been added without landlords

3. **RLS Policies**
   - Tours: `auth.uid() = tenant_id` for INSERT
   - Applications: `auth.uid() = tenant_id` for INSERT
   - User must be authenticated tenant to create

### Code Already Handles This

The frontend code (PropertyContactCard.tsx) already:
- ✅ Checks if `landlordId` exists (line 40)
- ✅ Shows warning banner if missing (line 128-135)
- ✅ Disables buttons when no landlord (lines 150, 165, 189)
- ✅ Shows error message for tour requests (line 66)

**But:** If properties have NULL landlord_id, all these safeguards trigger!

---

## 🎬 Complete SQL Fix Script

Run this entire block in Supabase SQL Editor:

```sql
-- ============================================
-- COMPLETE FIX SCRIPT - RUN ALL AT ONCE
-- ============================================

-- 1. Add notes column to tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS notes text;
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_scheduled_at ON tours(scheduled_at);

-- 2. Create landlord user if needed (replace email!)
-- First sign up on website, then uncomment and run:
-- UPDATE profiles SET role = 'landlord' WHERE email = 'your-email@example.com';

-- 3. Get landlord ID (will show in results)
SELECT id as landlord_id_to_use FROM profiles WHERE role = 'landlord' LIMIT 1;

-- 4. Assign landlord to all properties without one
-- IMPORTANT: Copy the UUID from above and paste it below:
-- UPDATE properties SET landlord_id = 'PASTE-UUID-HERE' WHERE landlord_id IS NULL;

-- 5. Verify fix
SELECT 
    'notes_column_exists' as check_name,
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'tours' AND column_name = 'notes') as passed
UNION ALL
SELECT 
    'all_properties_have_landlord',
    (SELECT COUNT(*) FROM properties WHERE landlord_id IS NULL) = 0
UNION ALL
SELECT 
    'landlord_users_exist',
    EXISTS(SELECT 1 FROM profiles WHERE role = 'landlord')
UNION ALL
SELECT 
    'tours_insert_policy_exists',
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'tours' AND policyname = 'tours_insert')
UNION ALL
SELECT 
    'apps_insert_policy_exists',
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'apps_insert');

-- All should return TRUE
```

---

## 🚀 After Database Fix

The database fix is IMMEDIATELY LIVE. You don't need to redeploy your code!

However, if you made code changes (like error handling in PropertyContactCard.tsx), you need to:

1. Commit changes: `git add . && git commit -m "Add error handling"`
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys in 2-3 minutes

---

## ✅ Success Checklist

- [ ] Tours table has `notes` column
- [ ] All properties have `landlord_id` assigned
- [ ] At least one user has `role = 'landlord'`
- [ ] RLS policies exist for tours and applications
- [ ] Test: Can request a tour successfully
- [ ] Test: Can submit an application successfully
- [ ] Test: Data appears in Supabase database

---

## 🆘 Still Not Working?

If you've done everything above and it still doesn't work:

1. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for red errors in Console tab
   - Share the error message

2. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for failed INSERT queries
   - Check error messages

3. **Verify authentication**
   ```sql
   -- Run while logged into your app
   SELECT auth.uid() as current_user_id, auth.role() as current_role;
   -- Should show your user ID, not NULL
   ```

4. **Check property data**
   ```sql
   -- Get property details for a specific property
   SELECT 
       id, title, landlord_id, slug, status,
       (SELECT email FROM profiles WHERE id = landlord_id) as landlord_email
   FROM properties 
   WHERE slug = 'your-property-slug';
   -- landlord_id and landlord_email should NOT be NULL
   ```

---

## 📞 Need Help?

If you're stuck, provide these details:
1. Output from DIAGNOSE_ISSUES.sql
2. Browser console errors (if any)
3. Supabase error logs (if any)
4. Which step failed
