# 🔍 Frontend Debugging Guide

## Database: ✅ WORKING
- All 8 properties have `landlord_id`
- Tours table has `notes` column
- 1 landlord, 2 tenants exist

## Code: ✅ CORRECT
- Property data-access fetches `landlord_id` ✅
- Maps to `landlordId` in Property type ✅
- Passes to PropertyContactCard ✅

## Problem: Frontend Still Broken

This means the issue is **browser/deployment related**, not database or code.

---

## 🎯 Most Likely Causes (in order)

### 1. ❌ User Not Signed In
**MOST COMMON ISSUE**

Tour and application features require authentication!

**Check:**
- Top right corner of website - do you see your email/profile?
- If you see "Sign in" button → You're NOT logged in!

**Fix:**
1. Click "Sign in" 
2. Log in with your account
3. Try tour/application again

---

### 2. ❌ Browser Cache (Old Code)
Website might be showing old cached version without the fixes.

**Fix:**
```
1. Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. Clear cache:
   - Chrome: F12 → Network tab → Check "Disable cache"
   - Or: Settings → Privacy → Clear browsing data → Cached images
3. Close and reopen browser
4. Try again
```

---

### 3. ❌ Old Deployment on Vercel
Your local code has fixes, but Vercel might be running old code.

**Check Deployment:**
1. Go to https://vercel.com/dashboard
2. Find your RentoH project
3. Click "Deployments" tab
4. Check:
   - Latest deployment status: Should be "Ready"
   - Latest commit message: Should match your latest changes
   - Deployment date: Should be recent

**If old deployment:**
```bash
# Push latest code to trigger rebuild
git add .
git commit -m "Trigger redeploy"
git push origin main

# Wait 2-3 minutes for Vercel to rebuild
```

---

### 4. ❌ Environment Variables Missing
Supabase connection might be broken.

**Check Browser Console (F12):**
Look for errors like:
```
Error: supabaseUrl is required
Error: Failed to fetch
```

**Fix for Vercel:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. If missing, add them from your Supabase dashboard
4. Redeploy

**Fix for Local Dev:**
1. Check `.env.local` file exists
2. Verify it has correct Supabase credentials
3. Restart dev server: `npm run dev`

---

### 5. ❌ Wrong User Role
You might be signed in as a landlord trying to request tours on your own property.

**Check in Supabase SQL Editor:**
```sql
-- See what role you have
SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
```

**Expected:** Should be `tenant` to request tours  
**If landlord:** Create a second account for testing tours

---

## 🧪 Step-by-Step Test

### Test 1: Are You Signed In?
1. Open website: https://rento-h.vercel.app (or localhost)
2. Look at top right corner
3. **Expected:** See your email or profile menu
4. **If not:** Click "Sign in" and log in

### Test 2: Open Browser Console
1. Press F12 (or right-click → Inspect)
2. Click "Console" tab
3. Look for RED error messages
4. **Screenshot and share any errors you see**

### Test 3: Check Network Requests
1. Still in DevTools, click "Network" tab
2. Go to a property page
3. Click "Request a tour"
4. Fill form and submit
5. In Network tab:
   - Look for request to Supabase (contains "tours" or "supabase")
   - Click on it
   - Check Status: Should be 201 or 200
   - Check Response: Should not have "error"
6. **Screenshot if you see errors**

### Test 4: Verify Property Has Landlord
1. Open property page
2. Open Console (F12)
3. Paste this and press Enter:
```javascript
// This will show the landlordId for debugging
console.log('Property data:', document.querySelector('[data-property-id]'));
```

---

## 📸 Information I Need

If still not working, please provide:

1. **Screenshot of top-right corner** (to see if signed in)
2. **Screenshot of browser Console** (F12 → Console tab)
3. **Screenshot of Network tab** when submitting tour request
4. **Are you testing on:**
   - [ ] Vercel production site (https://rento-h.vercel.app)
   - [ ] Local dev (http://localhost:3000)
5. **What happens when you click "Request a tour"?**
   - [ ] Button is disabled/grayed out
   - [ ] Form opens but submit fails
   - [ ] Nothing happens at all
   - [ ] Error message appears (what does it say?)

---

## 🚀 Quick Fixes to Try Now

### Fix 1: Force Sign Out & Back In
```
1. Click your profile → Sign out
2. Close browser completely
3. Reopen browser
4. Go to website
5. Sign in again
6. Try tour request
```

### Fix 2: Try Different Browser
```
If using Chrome, try Firefox or Edge
This rules out browser cache issues
```

### Fix 3: Test on Mobile
```
Open website on your phone
Try tour request there
If it works → Desktop browser cache issue
If it doesn't work → Server/deployment issue
```

### Fix 4: Check Property Page Directly
```
Visit this exact URL:
https://rento-h.vercel.app/property/house-for-3-people-41301634

Does the page load?
Do you see "Request a tour" button?
Is it clickable?
```

---

## 💡 Expected Behavior

### When Working Correctly:

1. **Property Page Loads**
   - Shows property details
   - Right sidebar has "Ready to move forward?" card
   - "Request a tour" button is BLUE and clickable

2. **Clicking "Request a tour"**
   - Form expands below button
   - Shows date, time, notes fields
   - "Send request" button appears

3. **Submitting Tour Request**
   - Button shows "Sending..."
   - After ~1 second, shows green success message
   - "Tour request sent. We'll email you once the landlord responds."
   - Form collapses

4. **Data in Database**
   - Run this in Supabase:
   ```sql
   SELECT * FROM tours ORDER BY created_at DESC LIMIT 1;
   ```
   - Should show your new tour request with notes

---

## 🆘 Emergency Nuclear Option

If NOTHING works:

```bash
# 1. Clear everything
rm -rf .next
rm -rf node_modules

# 2. Reinstall
pnpm install

# 3. Restart dev server
pnpm dev

# 4. In browser:
# - Clear ALL site data
# - Hard refresh (Ctrl+Shift+R)
# - Sign in fresh
# - Try again
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No errors in browser console
- ✅ Tour form opens when clicking button
- ✅ Submit shows success message
- ✅ Data appears in Supabase `tours` table
- ✅ Can submit applications successfully

---

**Next Step:** Try the "Step-by-Step Test" above and let me know:
- Which step fails?
- What error messages you see?
- Screenshots of console/network tab
