# Issues & Fixes

| Area | Issue | Fix |
| --- | --- | --- |
| Tours management | Landlords could not reliably set `confirmed/completed/cancelled` outside of brittle buttons; no global status indicator. | Added `components/tours/TourStatusMenu.tsx`, centralized fetch helper `lib/tours/update-status.ts`, and updated `app/(app)/tours/ToursClient.tsx` + `components/tours/DashboardTourList.tsx` for accessible status workflows. |
| Supabase visibility | No way to tell if database credentials were live, causing silent dashboard failures. | Introduced `lib/supabase/health.ts`, `/api/health/db`, and `components/dashboard/SupabaseHealthCard.tsx` (rendered on tenant & landlord dashboards). Banner now links to the JSON health endpoint. |
| Engagement UX | Landing/browse/property pages lacked a “recently viewed” pattern, forcing users to remember history manually. | Added `components/recently-viewed/RecentlyViewedTracker.tsx` + `RecentlyViewedRail.tsx`, wired into home, browse, and property pages via lightweight dynamic imports. |
| Dead code | `components/tours/TourRequestActions.tsx` was unused and drifted from reality. | Removed file to keep bundle lean and avoid conflicting behaviours. |
| Regression safety | No automated coverage for landlord transitions. | Added `__tests__/tours-status.test.ts` to lock allowed transitions and actionable states. |

## Schema
- No new schema changes required. If your database is missing tour statuses, apply `supabase/FIX_TOURS_TABLE.sql` (already checked in) to sync constraints.
