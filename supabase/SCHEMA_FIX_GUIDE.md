# Schema Fix Guide - Missing Columns Error

## 🐛 Error You're Experiencing
```
Could not find the 'prefs' column of 'profiles' in the schema cache
```

## 🔍 Root Cause
The `profiles` table in your database is missing several columns that the application code expects:
- ❌ `prefs` (JSONB) - User preferences
- ❌ `notifications` (JSONB) - Notification settings
- ❌ `city` (TEXT) - User's city
- ❌ `address` (TEXT) - User's address
- ❌ `contact_method` (TEXT) - Preferred contact method
- ❌ `dob` (TEXT) - Date of birth
- ❌ `bio` (TEXT) - User bio

## ✅ Quick Fix (Recommended)

### Option 1: Add Missing Columns (Keep Your Data)
```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/FIX_MISSING_COLUMNS.sql

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of FIX_MISSING_COLUMNS.sql
3. Paste and click "Run"
4. Wait 5 seconds
5. Refresh your application
```

**This will:**
- ✅ Add all missing columns
- ✅ Keep all existing data
- ✅ Fix the schema cache error
- ✅ Safe to run multiple times

### Option 2: Complete Reset (Lose All Data)
```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/COMPLETE_DATABASE_RESET.sql

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of COMPLETE_DATABASE_RESET.sql
3. Paste and click "Run"
4. Wait 30 seconds
5. Sign up with new accounts
```

**This will:**
- ⚠️ Delete ALL data
- ⚠️ Delete ALL user accounts
- ✅ Rebuild schema from scratch
- ✅ Include all required columns

---

## 📋 Step-by-Step Instructions

### 🎯 Recommended: Option 1 (Quick Fix)

#### Step 1: Verify Current State
```sql
-- Run this first to see what's missing:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

#### Step 2: Run the Fix Script
1. Open: `supabase/FIX_MISSING_COLUMNS.sql`
2. Copy entire contents
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click "Run"
5. You'll see messages like:
   ```
   ✓ Added prefs column to profiles table
   ✓ Added notifications column to profiles table
   ✓ Added city column to profiles table
   ...
   ```

#### Step 3: Verify Fix
```sql
-- Check all columns are now present:
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name IN ('prefs', 'notifications', 'city', 'address', 'contact_method', 'dob', 'bio');
```

Should return 7 rows.

#### Step 4: Test Application
1. Refresh your browser
2. Navigate to /profile page
3. Error should be gone! ✅

---

## 🔧 What Each Column Does

| Column | Type | Purpose | Default Value |
|--------|------|---------|---------------|
| `prefs` | JSONB | User search preferences (budget, beds, etc.) | `{}` |
| `notifications` | JSONB | Notification settings for email/SMS | `{"newMatches":true,...}` |
| `city` | TEXT | User's city location | NULL |
| `address` | TEXT | User's full address | NULL |
| `contact_method` | TEXT | Preferred contact (email/phone/chat) | NULL |
| `dob` | TEXT | Date of birth (ISO format) | NULL |
| `bio` | TEXT | User biography/description | NULL |

---

## 🚨 Troubleshooting

### Error Still Appears After Running Fix
**Solution:** Clear Supabase cache
```sql
-- Force schema cache refresh:
NOTIFY pgrst, 'reload schema';
```

Then refresh your browser.

### "Permission Denied" Error
**Solution:** Make sure you're logged in as the project owner in Supabase Dashboard.

### Script Doesn't Run
**Solution:** Check you're in the correct project:
1. Go to Supabase Dashboard
2. Verify project name matches
3. Check you're in SQL Editor (not Table Editor)

### Columns Added But Error Persists
**Solution:** Restart your development server
```bash
# Stop your dev server (Ctrl+C)
pnpm dev
# Restart and refresh browser
```

---

## 📊 Expected Schema After Fix

Your `profiles` table should have these columns:

```sql
profiles
├── id (uuid) PRIMARY KEY
├── role (text) DEFAULT 'tenant'
├── full_name (text)
├── email (text)
├── phone (text)
├── avatar_url (text)
├── bio (text)
├── city (text) ⭐ ADDED
├── address (text) ⭐ ADDED
├── contact_method (text) ⭐ ADDED
├── dob (text) ⭐ ADDED
├── verification_status (text) DEFAULT 'pending'
├── prefs (jsonb) DEFAULT '{}' ⭐ ADDED
├── notifications (jsonb) DEFAULT '{"newMatches":true...}' ⭐ ADDED
├── created_at (timestamptz) DEFAULT now()
└── updated_at (timestamptz) DEFAULT now()
```

---

## 🎯 Prevention

### To Avoid This in the Future

1. **Always use migration files** in `supabase/migrations/`
2. **Run FIX_MISSING_COLUMNS.sql** whenever adding new profile features
3. **Test locally** before deploying to production
4. **Keep schemas in sync** between development and production

### Files Updated
- ✅ `supabase/FIX_MISSING_COLUMNS.sql` - Quick fix script
- ✅ `supabase/COMPLETE_DATABASE_RESET.sql` - Full reset includes all columns
- ✅ Both scripts now have complete schema

---

## ✅ Success Checklist

After running the fix, verify:

- [ ] No more "prefs column not found" error
- [ ] /profile page loads without errors
- [ ] You can view your profile
- [ ] You can edit profile settings
- [ ] Contact preferences work
- [ ] All form fields appear correctly

---

## 📞 Still Having Issues?

### Debug Commands

**Check if columns exist:**
```sql
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Count your data:**
```sql
SELECT COUNT(*) as profile_count FROM public.profiles;
```

**Check one profile:**
```sql
SELECT * FROM public.profiles LIMIT 1;
```

---

## 📝 Summary

**Problem:** Application code expects `prefs` and other columns that don't exist in database

**Solution:** Run `FIX_MISSING_COLUMNS.sql` to add them

**Time:** 30 seconds

**Risk:** None - safe to run, won't delete data

**Result:** Profile page works, error gone! ✅

---

**Last Updated:** November 11, 2025  
**Status:** ✅ Fix Available  
**Risk Level:** 🟢 Safe to Apply
