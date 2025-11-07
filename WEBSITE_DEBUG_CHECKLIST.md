# 🔍 Website Debugging Checklist

## Database Status: ✅ FIXED
- ✅ 8 properties with landlords
- ✅ 1 landlord user exists
- ✅ Tours table has notes column

---

## 🚨 What to Check on the Website

### 1. Browser Console Errors
**Open DevTools (F12 or Right-click → Inspect)**

Check for these specific errors:

#### Common Error 1: Supabase Client Error
```
Error: supabaseUrl is required
Error: supabaseAnonKey is required
```
**Fix:** Environment variables not loaded. Check `.env.local` exists and is correct.

#### Common Error 2: Network/CORS Errors
```
Failed to fetch
CORS policy blocked
```
**Fix:** Supabase URL might be wrong, or service is down.

#### Common Error 3: Authentication Errors
```
User not authenticated
Session expired
```
**Fix:** Sign out and sign back in.

#### Common Error 4: RLS Policy Errors
```
new row violates row-level security policy
permission denied for table
```
**Fix:** User doesn't have correct permissions (check if signed in as tenant).

---

### 2. Test Each Feature Step-by-Step

#### Test: Tour Request
1. **Navigate** to any property page (e.g., `/property/house-for-3-people-41301634`)
2. **Check**: Do you see "Request a tour" button?
   - ❌ **No button?** → Property might be missing landlord_id (but DB shows all have it)
   - ❌ **Button disabled?** → Check yellow warning banner
3. **Click** "Request a tour"
4. **Fill** date, time, notes
5. **Submit**
6. **Expected**: Success message "Tour request sent..."
7. **Actual**: What happens? (screenshot or error message)

#### Test: Application Submission
1. **Navigate** to any property page
2. **Click** "Apply now"
3. **Expected**: Should go to `/property/{slug}/apply` page
   - ❌ **Redirects to /browse?** → Property missing landlord (but DB shows all have it)
4. **Fill** monthly income and message
5. **Submit**
6. **Expected**: Redirects to `/applications` page
7. **Actual**: What happens?

---

### 3. Check User Authentication

#### Are you signed in?
- **Top right corner**: Should show your email or profile icon
- **If not signed in**: Features won't work! Sign in first.

#### Check your user role
Run this in Supabase SQL Editor while logged into the website:
```sql
SELECT 
    auth.uid() as my_user_id,
    p.email,
    p.role,
    p.full_name
FROM profiles p
WHERE p.id = auth.uid();
```

**Expected**: Should show your user ID and role = 'tenant' or 'landlord'  
**If NULL**: You're not logged in or session expired

---

### 4. Check Environment Variables

#### Local Development (.env.local file)
Verify these exist and are correct:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
```

#### Production (Vercel)
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if used)

**If missing or wrong**: Features will fail silently!

---

### 5. Check Deployment Status

#### Is the latest code deployed?
1. **Check last commit**: 
   ```bash
   git log -1 --oneline
   ```
2. **Check Vercel**: Go to vercel.com/dashboard
   - Find your project
   - Check "Deployments" tab
   - Latest deployment should be from main branch
   - Status should be "Ready"

#### Code vs Database Mismatch
- ✅ Database has `notes` column
- ❓ Is deployed code sending `notes` field?
  - Check: Look at Network tab in DevTools
  - Find the POST request to Supabase
  - Verify payload includes `notes: "..."`

---

### 6. Network Tab Analysis

**In Browser DevTools → Network tab:**

#### When submitting tour request:
1. Filter by: `tours`
2. Look for POST request to Supabase
3. Click on the request
4. Check:
   - **Status Code**: Should be `201 Created`
   - **Response**: Should not have error
   - **Payload**: Should include `notes`, `property_id`, `landlord_id`, etc.

#### Common Issues:
- **Status 400**: Bad request (missing required field)
- **Status 401**: Not authenticated
- **Status 403**: Permission denied (RLS policy)
- **Status 500**: Server error (Supabase issue)

---

### 7. Specific Symptoms & Fixes

#### Symptom: Button is disabled/grayed out
**Cause**: Frontend thinks property has no landlord  
**Check**: 
```typescript
// PropertyContactCard.tsx line 40
const hasLandlord = Boolean(landlordId);
```
**Debug**: Console log the `landlordId` prop being passed  
**Fix**: Property might not be fetching landlord correctly

#### Symptom: Yellow warning banner appears
**Text**: "This property is currently being configured"  
**Cause**: `landlordId` prop is undefined/null  
**Fix**: Check how property data is fetched on property page

#### Symptom: Form submits but nothing happens
**Cause 1**: Network request failing silently  
**Check**: Network tab for errors  
**Cause 2**: Success redirect not working  
**Check**: Console for navigation errors

#### Symptom: "Sign in to request tour" even when signed in
**Cause**: `isAuthenticated` prop is false  
**Check**: Session/authentication hook  
**Fix**: Clear cookies, sign out and sign back in

---

## 🎯 Quick Diagnostic Commands

### Run in Browser Console (F12):
```javascript
// Check if Supabase is loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check authentication (if you have access to supabase client)
// This won't work directly in console, but you can add to component
```

### Run in Supabase SQL Editor:
```sql
-- Check if tour request was created (run after attempting)
SELECT * FROM tours ORDER BY created_at DESC LIMIT 5;

-- Check if application was created
SELECT * FROM applications ORDER BY created_at DESC LIMIT 5;

-- Check your current auth session
SELECT auth.uid(), auth.role();
```

---

## 📊 What Information to Provide

If still not working, please share:

1. **Browser Console errors** (screenshot or copy text)
2. **Network tab errors** (status codes and responses)
3. **What happens when you click the button?**
   - Does modal/form open?
   - Does it submit?
   - Any error messages?
4. **Are you signed in?** (check top right of page)
5. **Environment**: Local dev or production (Vercel)?
6. **URL** you're testing on

---

## 🔄 Nuclear Options (if nothing else works)

### Option 1: Clear Everything
```bash
# Local dev
rm -rf .next
npm run dev
```
Then hard refresh browser (Ctrl+Shift+R)

### Option 2: Fresh Sign In
1. Sign out completely
2. Clear browser cookies for your site
3. Sign back in
4. Try tour/application again

### Option 3: Redeploy
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```
Wait 2-3 minutes for Vercel to rebuild

### Option 4: Check Supabase Service Status
- Go to https://status.supabase.com/
- Make sure no outages

---

## ✅ Success Indicators

You'll know it's working when:
1. Tour request shows success message
2. Application redirects to /applications page
3. Data appears in Supabase database tables
4. No errors in browser console
5. Network tab shows 201 status codes
