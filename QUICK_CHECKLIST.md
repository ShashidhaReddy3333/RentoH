# ⚡ QUICK TROUBLESHOOTING CHECKLIST

## ✅ Database Status
- [x] Tours table has `notes` column
- [x] All 8 properties have `landlord_id` assigned
- [x] 1 landlord user exists
- [x] RLS policies exist

**Database is READY! ✅**

---

## 🔍 What to Check on Website

### Quick Test (30 seconds)

1. **Are you signed in?**
   - [ ] Yes - I see my email/profile in top right
   - [ ] No - I see "Sign in" button

   👉 **If No:** Sign in first! Tours/apps require authentication.

2. **Open Browser Console (F12)**
   - [ ] No red errors
   - [ ] See red errors (screenshot them)

   👉 **If errors:** Share screenshot with me

3. **Go to property page**
   - [ ] "Request a tour" button is blue and clickable
   - [ ] Button is gray/disabled with yellow warning

   👉 **If disabled:** Try hard refresh (Ctrl+Shift+R)

4. **Click "Request a tour"**
   - [ ] Form opens with date/time/notes fields
   - [ ] Nothing happens
   - [ ] Error message appears

   👉 **If nothing happens:** Check console for errors

5. **Fill and submit form**
   - [ ] See green success message
   - [ ] See red error message (what does it say?)
   - [ ] Button just keeps saying "Sending..."

---

## 🎯 Most Common Issues

### Issue 1: "You're not signed in"
**Symptom:** Buttons show "Sign in to..."  
**Fix:** Click Sign In, then try again

### Issue 2: Button is grayed out
**Symptom:** Can't click "Request a tour"  
**Fix:** Hard refresh browser (Ctrl+Shift+R)

### Issue 3: Old cached site
**Symptom:** No changes visible  
**Fix:** Clear browser cache or try incognito mode

### Issue 4: Wrong URL
**Symptom:** Testing on old deployment  
**Fix:** Use latest Vercel URL or localhost:3000

---

## 📝 What I Need From You

Please answer these:

1. **Where are you testing?**
   - [ ] Vercel production (https://rento-h.vercel.app)
   - [ ] Local dev (http://localhost:3000)

2. **Are you signed in?**
   - [ ] Yes, I see my email in top right
   - [ ] No, I see "Sign in" button

3. **What happens when you click "Request a tour"?**
   - [ ] Form opens (good!)
   - [ ] Button disabled (can't click)
   - [ ] Nothing happens
   - [ ] Error message: "___________"

4. **Browser Console errors?** (F12 → Console tab)
   - [ ] No errors
   - [ ] Yes, screenshot attached

5. **Network tab shows?** (F12 → Network tab, then submit form)
   - [ ] Request to Supabase with status 201 (success!)
   - [ ] Request fails with status code: ___
   - [ ] No request appears at all

---

## 🚀 Quick Fixes

### Try These First:

1. **Hard Refresh**
   ```
   Windows: Ctrl + Shift + R
   Mac: Cmd + Shift + R
   ```

2. **Sign Out & Back In**
   ```
   Click profile → Sign out
   Sign back in
   Try again
   ```

3. **Try Incognito/Private Mode**
   ```
   Opens fresh without cache
   If it works → cache issue
   ```

4. **Test Locally**
   ```
   Run: test-locally.bat
   Or: pnpm dev
   Visit: http://localhost:3000
   ```

---

## 💬 Report Format

Copy this and fill in:

```
TESTING ON: [ ] Production / [ ] Local
SIGNED IN: [ ] Yes / [ ] No
WHAT HAPPENS: [describe what you see]
CONSOLE ERRORS: [yes/no, screenshot if yes]
TRIED HARD REFRESH: [ ] Yes / [ ] No
```

---

## ⚡ Expected vs Actual

### ✅ Expected (Working):
1. Property page loads
2. Signed in (see email top right)
3. "Request a tour" button is blue
4. Click → Form expands
5. Fill date/time/notes
6. Submit → Green success message
7. Check Supabase → Tour appears in database

### ❌ What's happening for you?
[Tell me which step fails and what you see instead]
