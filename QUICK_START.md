# RentoH Quick Start

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

**Create Project:** Go to [supabase.com](https://supabase.com) → New Project

**Setup Database:**
1. Open SQL Editor in Supabase dashboard
2. Paste and run `supabase/schema.sql`

**Get API Keys:** Project Settings → API
- Copy **Project URL** and **anon key**

### 3. Create .env.local
```bash
cp env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ What Got Fixed

### Authentication
- ✅ Sign-in and sign-up pages now accessible
- ✅ Proper redirects when Supabase not configured
- ✅ Config banner shows clear setup instructions

### Landlord Features
- ✅ Landlord onboarding works (visit `/onboarding/landlord`)
- ✅ Listing creation ready to use
- ✅ Role upgrades properly saved

### Messaging
- ✅ "Message landlord" button functional
- ✅ Threads created automatically from property pages
- ✅ Real-time messaging with proper error handling

### Documentation
- ✅ Complete setup guide (`SETUP_GUIDE.md`)
- ✅ Detailed fix summary (`FIXES_APPLIED.md`)
- ✅ Improved environment config (`env.example`)

---

## 🧪 Test the Fixes

### Without Supabase (Dev Mode)
```bash
# Remove or don't create .env.local
npm run dev
```

Try:
- Access `/auth/sign-in` → See config banner ✅
- Access `/dashboard` → Redirect to sign-in ✅
- Header sign-in button → Loads page ✅

### With Supabase
```bash
# With proper .env.local
npm run dev
```

Try:
- Sign up new account → Works ✅
- Sign in → Redirects to dashboard ✅
- Upgrade to landlord → `/onboarding/landlord` ✅
- View property → Click "Message landlord" ✅
- View messages → See thread ✅

---

## 📖 Need More Info?

- **Full Setup Guide:** `SETUP_GUIDE.md`
- **Detailed Fixes:** `FIXES_APPLIED.md`
- **Environment Config:** `env.example`
- **Database Schema:** `supabase/schema.sql`

---

## 🆘 Common Issues

**"Supabase connection inactive" banner?**
→ Add credentials to `.env.local` and restart dev server

**Can't sign in?**
→ Enable Email provider in Supabase Auth settings

**Can't create listings?**
→ Upgrade to landlord role first at `/onboarding/landlord`

**Database errors?**
→ Run `supabase/schema.sql` in SQL Editor

---

## 🎯 Key Changes from Review

| Issue | Status | File |
|-------|--------|------|
| Auth pages unreachable | ✅ Fixed | `middleware.ts` |
| Landlord onboarding broken | ✅ Fixed | `app/(app)/onboarding/landlord/page.tsx` |
| Message button not working | ✅ Fixed | `components/property/PropertyContactCard.tsx` |
| Missing setup docs | ✅ Added | `SETUP_GUIDE.md` |
| Unclear env config | ✅ Improved | `env.example` |

All critical issues from the review have been resolved!
