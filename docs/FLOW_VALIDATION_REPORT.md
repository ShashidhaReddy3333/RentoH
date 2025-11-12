# Flow Validation Report

Date: 2025-01-25

## Login / Auth
- Verified `app/auth/sign-in` and Supabase revalidation via `components/providers/SupabaseListener.tsx`.
- Ensured CSRF token fallback exists and `/auth/callback` sync keeps server + client sessions aligned.

## Favorites
- Exercised `components/ui/FavoriteButton.tsx` optimistic toggle + `/api/favorites` route.
- Confirmed rate limiting and revalidation of `/favorites`, `/dashboard`, and `/property/[slug]` after mutations.

## Apply / Property CTA
- Reviewed `components/property/PropertyContactCard.tsx` to ensure authenticated tenants can apply, schedule tours, or message landlords without accessing the same property as owner.
- Landlord ID missing cases now show inline error, preventing broken requests.

## Tour Scheduling
- Added explicit Confirmed/Completed/Cancelled status controls via `components/tours/TourStatusMenu.tsx` and centralized mutation helper `lib/tours/update-status.ts`.
- Unit tests in `__tests__/tours-status.test.ts` lock allowed transitions and actionable states.

## Messaging / Chat
- Server action `app/(app)/messages/create-thread-action.ts` checked for auth + rate limiting; verified returned redirect path.
- Header badge reflects unread count through `hasUnreadThreads` and ensures ARIA labels mention unread state.

## Admin / Landlord Dashboard
- Added `components/dashboard/SupabaseHealthCard.tsx` to surface live DB status.
- Confirmed landlord stats derive from `listOwnedProperties`, `listApplicationsForLandlord`, and `listUpcomingToursForLandlord` ensuring Supabase-backed summaries.
