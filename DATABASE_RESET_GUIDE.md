# 🔄 Database Reset Guide

## ✅ Build Status: FIXED
The build error has been fixed. The application now builds successfully.

**Issue:** React Hook `useState` was called after conditional return  
**Solution:** Moved all hooks to the top of the component  
**Status:** ✅ Build passing

---

## 🗄️ How to Reset Your Database

### ⚠️ WARNING
**This will DELETE ALL DATA** from your Supabase database. Only proceed if you're okay losing everything.

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard
```
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
```

#### 2. Run the Reset Script
```
1. Open the file: supabase/COMPLETE_DATABASE_RESET.sql
2. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)
3. In Supabase SQL Editor, click "New Query"
4. Paste the script (Ctrl+V)
5. Click "Run" (or press Ctrl+Enter)
```

#### 3. Wait for Completion
```
⏱️ The script will take 10-30 seconds to run
✅ You'll see a success message when done
```

#### 4. Verify Reset
```sql
-- Run this query to verify tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- You should see:
-- applications
-- favorites
-- message_threads
-- messages
-- profiles
-- properties
-- saved_properties
-- tours
-- user_preferences
```

---

## 📋 What the Script Does

### 1. Cleanup Phase
- ✅ Drops all existing policies
- ✅ Drops all triggers
- ✅ Drops all functions
- ✅ Drops all views
- ✅ Drops all tables (in correct order)

### 2. Recreation Phase
- ✅ Creates all tables with proper schema
- ✅ Creates indexes for performance
- ✅ Enables Row Level Security (RLS)
- ✅ Creates RLS policies
- ✅ Creates triggers for auto-updates
- ✅ Creates functions (profile creation, favorite counts)

### 3. Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts and profiles |
| `properties` | Property listings |
| `message_threads` | Conversation threads |
| `messages` | Individual messages |
| `favorites` | User's favorite properties |
| `saved_properties` | Alias for favorites |
| `applications` | Rental applications |
| `tours` | Property tour scheduling |
| `user_preferences` | Notification settings |

---

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **Profiles**: Public read, owner can update
- **Properties**: Public read, landlord can manage
- **Messages**: Only thread participants can access
- **Applications**: Only tenant and landlord can view
- **Tours**: Only tenant and landlord can manage
- **Favorites**: Only owner can manage

### Automatic Features
- ✅ Profile created automatically on signup
- ✅ Favorite counts updated automatically
- ✅ Timestamps updated automatically
- ✅ Foreign key constraints enforced

---

## 🧪 After Reset - Test These

### 1. Authentication
```
✅ Sign up with new account
✅ Profile should be created automatically
✅ Try signing in
```

### 2. Create Test Data
```
As Landlord (shashidharreddy3333@gmail.com):
1. Complete onboarding → Become landlord
2. Create a property listing
3. Verify property appears on browse page

As Tenant (shashidharreddy3827@gmail.com):
1. Sign up or sign in
2. Browse properties
3. Add property to favorites
4. Request a tour
5. Send a message
6. Submit an application
```

### 3. Verify Features
```
✅ Dark mode toggle works
✅ Search suggestions work
✅ Property comparison works
✅ Messages are sent/received
✅ Tours can be confirmed/completed/cancelled
✅ Applications can be submitted
✅ Favorites can be added/removed
```

---

## 🐛 Troubleshooting

### Issue: Script fails with "permission denied"
**Solution:** Make sure you're using the project owner account in Supabase

### Issue: Tables not created
**Solution:** Run the script again - it's idempotent (safe to run multiple times)

### Issue: Authentication not working
**Solution:** 
1. Check Supabase → Authentication → Settings
2. Ensure email auth is enabled
3. Check your environment variables

### Issue: RLS policies blocking access
**Solution:** 
```sql
-- Temporarily disable RLS for testing (not recommended for production)
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Database Schema Overview

```
profiles (user accounts)
  ↓
properties (listings by landlords)
  ↓
├── favorites (users save properties)
├── tours (users schedule tours)
├── applications (users apply)
└── message_threads (users message landlords)
      ↓
      messages (individual messages)
```

---

## 🔄 Common SQL Commands

### View all profiles
```sql
SELECT id, email, full_name, role, verification_status 
FROM public.profiles 
ORDER BY created_at DESC;
```

### View all properties
```sql
SELECT id, title, city, price, landlord_id, verified 
FROM public.properties 
ORDER BY created_at DESC;
```

### View all tours
```sql
SELECT t.id, t.status, t.scheduled_at, p.title as property_title
FROM public.tours t
JOIN public.properties p ON t.property_id = p.id
ORDER BY t.scheduled_at DESC;
```

### Count records
```sql
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM public.properties) as properties,
  (SELECT COUNT(*) FROM public.tours) as tours,
  (SELECT COUNT(*) FROM public.applications) as applications,
  (SELECT COUNT(*) FROM public.messages) as messages;
```

---

## 📝 Next Steps After Reset

1. **Test Authentication**
   - Sign up with both test accounts
   - Verify profiles are created
   - Check email confirmation (if enabled)

2. **Create Sample Data**
   - Add 2-3 properties as landlord
   - Create tours as tenant
   - Send messages between accounts

3. **Test All Features**
   - Tours management (confirm, complete, cancel)
   - Dark mode toggle
   - Property comparison
   - Search functionality
   - Favorites system
   - Application workflow

4. **Monitor Logs**
   - Check Supabase logs for any errors
   - Check browser console for client errors
   - Verify RLS policies are working

---

## 🎯 Summary

### ✅ Build Fixed
- React Hooks error resolved
- Application builds successfully
- No blocking errors

### ✅ Database Reset Script Ready
- Complete cleanup and recreation
- All tables, policies, and functions included
- Safe to run multiple times
- Automatic success verification

### 📁 Files Created
1. `supabase/COMPLETE_DATABASE_RESET.sql` - Main reset script
2. `DATABASE_RESET_GUIDE.md` - This guide

### 🚀 You're Ready To:
1. Run the SQL script in Supabase
2. Test with clean database
3. Deploy with confidence

---

**Need Help?** 
- Check Supabase logs: Dashboard → Logs
- Check RLS policies: Dashboard → Authentication → Policies
- Review schema: Dashboard → Table Editor

**Status:** ✅ Ready to execute database reset
