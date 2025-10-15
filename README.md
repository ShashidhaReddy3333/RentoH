# Rento MVP (Refined Starter)

This is a clean Next.js + Tailwind scaffold aligned to the Rento MVP plan.
It ships with:
- Design system tokens for the **Rento Bridge** palette
- Pages: Home/Search, Property Detail, Dashboard, Messages
- API stubs ready to swap to Supabase
- Components: PropertyCard, ChatPane
- Strong accessibility defaults

## Quick Start
```bash
npm i
npm run dev
```

## Hook up Supabase
1. Create a Supabase project; copy **URL** and **anon key** to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
2. Create tables using your schema (see /supabase/schema.sql template).
3. Replace API stubs with Supabase queries and client auth.

## Notes
- This starter renders mock data so you can see the UI immediately.
- Swap mock with `/api/properties` real queries when DB is ready.
- Keep tokens/colors in `tailwind.config.ts` and `app/globals.css`.
