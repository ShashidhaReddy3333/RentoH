# RENTO Technical Audit

_Generated: 2025-10-22_

## Architecture Overview

- **Shell**: `app/layout.tsx` is a server component but instantiates multiple client providers (`ThemeProvider`, `AppProvider`, `Header`, `SupabaseListener`, `StickyMobileNav`). This forces hydration on every route and wires Supabase session refresh into the shell.
- **Data flow**: Most feature routes hand off to client components backed by the mock-data `AppProvider`. Server routes (e.g. `/search`, `/dashboard`) fetch through `lib/search/service.ts` and `lib/supabase/server.ts` using the Supabase anon key.
- **Auth**: Supabase session refresh runs through `middleware.ts` + `lib/supabase/middleware.ts`, while client auth listeners post to `/auth/callback`.
- **APIs**: `/api/listings/search` proxies to Supabase, `/api/messages` is a stub with no validation yet.

```mermaid
graph TD
  subgraph App Shell
    Layout["app/layout.tsx (server)"] --> Theme["theme-provider.tsx (client)"]
    Layout --> AppCtx["AppProvider (client, mock data)"]
    AppCtx --> Header["components/header.tsx (client, Supabase)"]
    AppCtx --> SupaListener["SupabaseListener (client ➜ POST /auth/callback)"]
    Layout --> Footer["components/footer.tsx (client)"]
    Layout --> Sticky["StickyMobileNav.tsx (client)"]
  end

  Layout --> Landing["app/page.tsx (client landing)"]
  Layout --> Search["app/search/page.tsx (server)"]
  Layout --> Dashboard["app/dashboard/page.tsx (server)"]
  Layout --> Messages["app/messages/page.tsx (client)"]
  Layout --> Admin["app/admin/page.tsx (client)"]

  Landing --> SearchHero["SearchHero (client)"]
  Search --> SearchView["SearchView (client)"]
  SearchView --> APISearch["/api/listings/search (route handler)"]
  APISearch --> SearchSvc["lib/search/service.ts (server)"]
  SearchSvc --> SupaServer["lib/supabase/server.ts (anon client)"]
  SupaServer --> Supabase["Supabase DB (properties / favorites / messages)"]

  SearchView --> Mapbox["ListingsMap (client, mapbox-gl)"]

  Dashboard --> DashboardClient["dashboard-client.tsx (client, mock landlord u2)"]
  DashboardClient --> AppCtx
  Messages --> ChatPane["ChatPane (client, local state)"]
  Admin --> AppCtx

  SupaListener --> AuthCallback["/auth/callback route handler"]
  AuthCallback --> SupaServer

  subgraph Middleware
    Middleware["middleware.ts (edge)"] --> SupaMiddleware["lib/supabase/middleware.ts"]
  end
  SupaMiddleware --> SupaServer
  Middleware --> SecurityHdrs["Security headers & session refresh"]

  Landing --> OTP["components/auth/EmailOtpForm.tsx (client)"]
  OTP --> SupaBrowser["lib/supabase/client.ts (browser client)"]
  SupaBrowser --> Supabase

  class Layout,Search,Dashboard server;
  class Theme,AppCtx,Header,SupaListener,Footer,Sticky,Landing,SearchHero,SearchView,Mapbox,DashboardClient,Messages,ChatPane,Admin,OTP,SupaBrowser boundary;
  classDef server fill:#e0f7fa,stroke:#0097a7,color:#111;
  classDef boundary fill:#ffe0e0,stroke:#ff4d4f,color:#111,font-weight:600;
```

**Boundary flags** (red nodes) mark current hydration hotspots or client/server mismatches that need refactoring.

## Top 20 Issues (Most Critical First)

| Severity | Description | File:line | Fix |
| --- | --- | --- | --- |
| High | Root layout mounts ThemeProvider, AppProvider, Header, SupabaseListener, forcing every route to hydrate large client bundles and Supabase listeners. | app/layout.tsx:27-36 | Split into server-only shell + authenticated client layout; lazy-load nav via `next/dynamic` and keep session refresh inside the auth layout. |
| High | Landing page is marked `'use client'` even though it only renders static marketing copy, so it drags the entire AppProvider mock dataset into the first paint. | app/page.tsx:2-18 | Convert to server component, feed featured listings via server query, and wrap CTA buttons with small client hooks if needed. |
| High | `AppProvider` serialises all mock properties/users/messages into global client state, re-renders on every toggle, and hits `localStorage` from the shell. | components/providers/app-provider.tsx:56-186 | Replace with server data loaders + granular contexts (favorites, messaging) loaded via RSC and SWR; drop mock data from production bundles. |
| High | Header instantiates a Supabase browser client and subscribes to auth state on every page load, keeping the app dependent on client env variables and extra network churn. | components/header.tsx:23-68 | Render header as an RSC that reads session from cookies (middleware already refreshes tokens) and expose a tiny client logout action. |
| High | Search experience is entirely client-managed: `SearchView` hydrates initial results then re-fetches via REST, duplicating server queries and preventing streaming. | components/search/search-view.tsx:24-118 | Keep filter form client-side but move result list/map into an RSC that streams results via `use`/server actions; push incremental data to map via `dynamic()` chunk. |
| High | `ListingsMap` eagerly imports `mapbox-gl` and CSS in the main bundle; this pulls ~700 KB before the user requests the map. | components/search/listings-map.tsx:6-107 | Wrap in `next/dynamic({ ssr:false })`, lazy-load styles, gate on viewport, and default to a lightweight placeholder until the user opens the map. |
| High | `/api/messages` blindly trusts payloads, lacks Supabase session checks, CSRF mitigation, or schema validation. | app/api/messages/route.ts:4-7 | Require `createSupabaseServerClient`, validate input with Zod, ensure sender matches `auth.uid()`, and enforce rate limits. |
| High | Middleware protects only `/dashboard` and `/messages`, leaving `/listings/new`, `/profile`, `/admin` accessible to anonymous users. | middleware.ts:7-8 | Expand matcher (or use route groups) to guard all tenant/landlord/admin routes; add role checks for `/admin/*`. |
| High | SupabaseListener posts session tokens to `/auth/callback` without any CSRF token or nonce, exposing session hijack risk. | components/providers/supabase-listener.tsx:13-28 | Sign requests with an HMAC or include a double-submit cookie, restrict endpoint to POST + same-site, or replace with server actions. |
| High | Server Supabase client still uses the anon key, so admin actions can’t bypass RLS and secrets remain unused. | lib/supabase/server.ts:11-21 | Add optional service-role client (server-only env) for admin jobs, while keeping anon key for user-scoped operations. |
| High | Dashboard enforces auth server-side but renders with mock data (`CURRENT_LANDLORD_ID = "u2"`), so the experience never touches Supabase. | app/dashboard/dashboard-client.tsx:15-32 | Replace with RSC fetching landlord data via Supabase and hydrate only the interactive bits (delete/favorite) with client hooks. |
| Medium | Listing metrics formatter renders corrupted glyphs (`�?`) because of an invalid fallback string. | components/search/listings-list.tsx:125-127 | Replace placeholder with human text (e.g., `"—"`) and ensure `Intl.NumberFormat` handles decimals. |
| Medium | Manage listing “Performance snapshot” displays unreadable characters and fake analytics, eroding trust. | app/listings/[id]/manage/property-manage-client.tsx:128-131 | Remove hard-coded strings, drive metrics from Supabase analytics or hide card until data exists. |
| Medium | Property detail route is a stub (`TODO`) with `A� Waterloo` in the description, breaking localisation and SEO. | app/property/[id]/page.tsx:8-18 | Fetch property via Supabase, normalise text encoding, and supply OG metadata per listing. |
| Medium | Password field placeholder contains garbage characters, confusing screen readers and masking localisation. | app/auth/sign-in/page.tsx:60-66 | Replace with descriptive helper text + `aria-describedby`; drop meaningless placeholder. |
| Medium | “Save listing” flow only updates client context, relies on `setTimeout`, and never persists to Supabase. | app/listings/new/page.tsx:49-74 | Use a server action / API route with validation, optimistic UI via transition, and redirect once the insert succeeds. |
| Medium | Browse route returns an empty array whenever Supabase env vars are absent, so the page silently renders nothing. | lib/data/properties.ts:6-36 | Provide mock dataset fallback with a warning banner, or surface a configuration error so deployments fail fast. |
| Medium | Messages view rebuilds conversations with nested `find()` calls, leading to O(n²) work and stale derived state. | app/messages/page.tsx:16-96 | Index properties/users once (Map keyed by id), memoise conversation DTOs server-side, and stream them to the client. |
| Medium | Health check exposes site and Supabase URLs to unauthenticated callers, giving attackers environment insight. | app/api/health/auth/route.ts:14-19 | Require an internal token for diagnostics or restrict response to status booleans without URLs. |
| Medium | Chat pane renders message history without `role="log"`/`aria-live`, so assistive tech never announces new messages or typing indicators. | components/chat-pane.tsx:92-148 | Wrap message list in `role="log" aria-live="polite"` with focus management and `aria-atomic`. |
| Medium | `window.confirm` is used for destructive actions without accessible alternatives and cannot be themed. | app/dashboard/dashboard-client.tsx:110-120 | Replace with a modal dialog component that traps focus, provides context, and records analytics on confirm/cancel. |

## Delivered Remediations (this pass)

- Added rigorous Zod-backed environment parsing with separate server/client exports (`lib/env.ts`), eliminating ad-hoc `process.env` access.
- Hardened middleware & Next config with CSP, HSTS, Referrer-Policy, and guarded Supabase cookie refresh; added host-aware headers in `next.config.js`.
- Created Playwright + Vitest scaffolding under `tests/` (search params unit tests, listings search integration test, auth/listing/message E2E flows).
- Upgraded CI (`.github/workflows/ci.yml`) to run lint, typecheck, unit, build, and Playwright (with Playwright browser install), including placeholder Supabase env values.
- Documented bundle-inspection steps in `scripts/analyze-bundle.md`.

### Diff Highlights

```diff
diff --git a/lib/env.ts b/lib/env.ts
@@
-const schema = z.object({
-  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
-  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
-  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20)
-});
-const parsed = schema.safeParse(rawEnv);
-export const env = parsed.success ? parsed.data : fallback;
-export const hasSupabaseEnv = parsed.success;
+const serverSchema = z.object({
+  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
+  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
+  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
+  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
+  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
+  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
+  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
+  SUPABASE_STORAGE_BUCKET_LISTINGS: z.string().min(1).default("listing-media"),
+  EMAIL_FROM_ADDRESS: z.string().email().optional()
+});
+const clientSchema = z.object({
+  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
+  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
+  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
+  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional()
+});
+const env = Object.freeze(serverParsed.data);
+const clientEnv = Object.freeze(clientParsed.data);
+export { env, clientEnv };
+export const hasSupabaseEnv =
+  Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

```diff
diff --git a/middleware.ts b/middleware.ts
@@
-const PROTECTED_ROUTES = ['/dashboard', '/messages'];
+const PROTECTED_ROUTES = ['/dashboard', '/messages'];
@@
-const SECURITY_HEADERS = [
-  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
-  { key: 'X-Content-Type-Options', value: 'nosniff' }
-];
+const SECURITY_HEADERS: Record<string, string> = {
+  'Content-Security-Policy': csp,
+  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
+  'Referrer-Policy': 'strict-origin-when-cross-origin',
+  'X-Frame-Options': 'DENY',
+  'X-Content-Type-Options': 'nosniff',
+  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
+};
+function applySecurityHeaders(res: NextResponse) {
+  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => res.headers.set(key, value));
+  return res;
+}
@@
-    return NextResponse.redirect(redirectUrl);
+    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
@@
-  return response;
+  return applySecurityHeaders(response);
```

```diff
diff --git a/next.config.js b/next.config.js
new file mode 100644
@@
+const mapboxHosts = [
+  'https://api.mapbox.com',
+  'https://events.mapbox.com',
+  'https://*.tiles.mapbox.com'
+];
+const contentSecurityPolicy = [
+  "default-src 'self'",
+  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
+  `connect-src ${connectSrc.join(' ')}`,
+  `img-src ${imgSrc.join(' ')}`,
+  `font-src ${fontSrc.join(' ')}`,
+  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
+  "worker-src 'self' blob:",
+  'upgrade-insecure-requests'
+].join('; ');
+const securityHeaders = [
+  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
+  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
+  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
+  { key: 'X-Frame-Options', value: 'DENY' },
+  { key: 'X-Content-Type-Options', value: 'nosniff' },
+  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
+];
+module.exports = {
+  reactStrictMode: true,
+  poweredByHeader: false,
+  experimental: {
+    typedRoutes: true,
+    optimizePackageImports: ['lucide-react']
+  },
+  images: {
+    remotePatterns: [
+      { protocol: 'https', hostname: 'images.unsplash.com' },
+      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : [])
+    ]
+  },
+  async headers() {
+    return [{ source: '/:path*', headers: securityHeaders }];
+  }
+};
```

## Performance Playbook

### Caching & ISR
- Add route-level revalidation where data is stable: e.g. `app/page.tsx` can use `revalidate = 3600` once the hero data pulls from Supabase; `app/search/page.tsx` should set `cache: "no-store"` but wrap expensive filters with `unstable_cache`.
- Precompute frequently used aggregates (e.g. featured listings, landlord stats) via Supabase `materialized views` + `revalidateTag`.

### Streaming & Server Actions
- Stream search results by returning `<Suspense>` slots from `app/search/page.tsx` and moving list/map rendering to server components so the first chunk ships instantly.
- Convert `/auth` forms to server actions: post credentials, set cookies, redirect without client fetch loops.
- Use `server-only` modules for dashboard metrics so expensive calls never land in the client.

### Dynamic Imports & Bundle Control
- Wrap Mapbox (`ListingsMap`) and chat view (message composer) in `next/dynamic({ ssr:false })` to shrink initial JS.
- Code-split admin-only panels (verifications, reports) so tenant dashboards don’t download them.
- Replace mock data module with on-demand fetchers; expose analytics via `next/cache`.

### Assets, Fonts & Images
- Switch to `next/font` with display swap for headings/body, and preload hero font weights.
- Audit `next/image` usage: add `priority` to above-the-fold hero, set proper `sizes`, remove `unoptimized` previews by proxying uploads through Supabase Storage.
- Inline critical CSS for top fold using `@next/next/no-css-tags` instrumentation or `styled-jsx` for hero sections.

### Third-party Scripts
- Lazily load Mapbox & any analytics tags behind `navigator.connection.saveData` check.
- Wrap future analytics (e.g. PostHog) in Consent Management Platform hooks.

### Budgets & Targets
- **Route JS**: < 180 KB gzipped per route.
- **Shared JS**: < 90 KB gzipped.
- **LCP**: < 2.5 s on 4G mid-tier devices.
- **CLS**: < 0.1.
- **INP**: < 200 ms.
- Track bundle size by adding `npx nextjs-bundle-analysis --build-output .next --budget scripts/bundle-budget.json` to CI (see `scripts/analyze-bundle.md`).

## Security & Supabase Hardening

- Guard all authenticated routes via middleware + server checks; add role-based conditions for `/admin`.
- Move service-role key into env and expose a dedicated server-only helper for admin jobs (never import into client code).
- Ensure secrets never leak into logs (strip `console.error` payloads in `lib/search/service.ts` / `lib/data/properties.ts`).
- Lock down health endpoints behind static secrets or VPN allowlists.

### RLS Policies (examples)

```sql
-- Listings: landlord owns record
alter table public.properties enable row level security;
create policy "landlords-manage-own-properties"
  on public.properties
  for all
  using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

-- Messages: only participants can read/write
alter table public.messages enable row level security;
create policy "participants-read-messages"
  on public.messages
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "senders-insert-messages"
  on public.messages
  for insert
  with check (auth.uid() = sender_id);

-- Favorites: logged-in user scopes
alter table public.favorites enable row level security;
create policy "users-own-favorites"
  on public.favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Storage Bucket Policy (`listing-media`)

```sql
create policy "listing-images-writable-by-landlord"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-media'
    and auth.uid() = owner
  );

create policy "listing-images-readable-by-authenticated"
  on storage.objects
  for select
  using (bucket_id = 'listing-media');
```

### Service-role Safety
- Only load `SUPABASE_SERVICE_ROLE_KEY` inside server actions (`"use server"`) or API routes; never export it from shared modules.
- For background jobs, inject the service-role key as a parameter (e.g. Vercel cron) rather than bundling it.

## Accessibility & UX

### Checklist
- **Forms**: Labels exist but helper/error text is inconsistent; add `aria-describedby` and mark required fields.
- **Error feedback**: Most forms set `status` strings but do not focus error messages; use `ref` to shift focus on submit failure.
- **Focus management**: Modal/dialog patterns are missing (e.g. delete confirmation uses `window.confirm`); adopt a11y-compliant dialog component.
- **Keyboard navigation**: Map pins rely on click only; add keyboard support & visible focus state.
- **Dynamic updates**: Chat pane lacks `aria-live`; typing indicator not announced.
- **i18n**: Several strings include hard-coded currency/emoji; use `Intl.NumberFormat` and accessible emoji (`aria-label`).
- **Color contrast**: Frequent use of `text-textc/60` on `bg-brand-bg` falls below WCAG AA (≈2.6:1). Define tokens:
  - `text-muted = text-textc/70`
  - `bg-surface-muted = #EEF2F6`
  - `focus-ring = outline-brand-blue (contrast 4.5:1)`
  - `border-subtle = #CBD5E1`

### JSX Before / After Examples

**1. Sign-in password field**

```tsx
// Before (app/auth/sign-in/page.tsx:52-66)
<input
  id="password"
  type="password"
  required
  autoComplete="current-password"
  className="input"
  value={password}
  onChange={(event) => setPassword(event.target.value)}
  placeholder="�?��?��?��?��?��?��?��?�"
/>
```

```tsx
// After
<input
  id="password"
  type="password"
  required
  autoComplete="current-password"
  className="input"
  value={password}
  onChange={(event) => setPassword(event.target.value)}
  aria-describedby="signin-password-hint"
/>
<p id="signin-password-hint" className="text-xs text-textc/60">
  Use at least 8 characters mixing letters and numbers.
</p>
```

**2. Chat log announcements**

```tsx
// Before (components/chat-pane.tsx:92-146)
<div ref={listRef} className="flex-1 space-y-3 overflow-y-auto ...">
  {sortedMessages.map(...)}
</div>
```

```tsx
// After
<div
  ref={listRef}
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  className="flex-1 space-y-3 overflow-y-auto focus:outline-none"
>
  {sortedMessages.map(...)}
</div>
```

**3. Delete listing confirmation**

```tsx
// Before (dashboard-client.tsx:112-120)
onClick={() => {
  const isConfirmed = window.confirm(`Are you sure ...?`);
  if (isConfirmed) deleteProperty(property.id);
}}
```

```tsx
// After
<ConfirmDialog
  title={`Delete ${property.title}?`}
  description="This cannot be undone."
  confirmLabel="Delete listing"
  onConfirm={() => deleteProperty(property.id)}
>
  <Button type="button" variant="ghost" className="flex-1">
    Delete
  </Button>
</ConfirmDialog>
```

## SEO & Growth

- **Metadata**: Add canonical URLs, description, and OG/Twitter cards via `generateMetadata`. Provide per-listing OG image using Vercel OG.
- **Structured data**: Embed JSON-LD for Organization (site-wide) and `RealEstateListing` per property; add FAQ schema for onboarding.
- **Sitemap & robots**: Generate via `app/sitemap.ts` & `app/robots.txt`. Exclude `/admin`, `/dashboard`, `/messages`.
- **Canonical host enforcement**: Use `next.config.js` `headers` to redirect non-primary domains.
- **Search page**: Append `rel="prev/next"` for paginated results once pagination is server-rendered.

### Event Tracking Spec (TypeScript)

```ts
export type AnalyticsEvent =
  | {
      event: "sign_up";
      method: "email" | "magic_link" | "oauth";
      userId?: string;
    }
  | {
      event: "listings_create";
      listingId: string;
      landlordId: string;
      price: number;
      city: string;
      source: "dashboard" | "onboarding";
    }
  | {
      event: "favorite_add";
      listingId: string;
      userId: string;
      price?: number;
      city?: string;
    }
  | {
      event: "message_send";
      threadId: string;
      listingId: string;
      senderId: string;
      recipientId: string;
      bodyLength: number;
    };
```

Instrument these via a thin `track(event: AnalyticsEvent)` wrapper, and ship to your analytics provider after consent.

## Testing & CI

- **Current coverage**: New Vitest suites (`tests/unit/search/params.test.ts`, `tests/integration/api/listings-search.test.ts`) and Playwright flows (`tests/e2e/auth.spec.ts`, `listing-create.spec.ts`, `messages.spec.ts`).
- **Next steps**:
  - Add Supabase-mocked tests for `createSupabaseServerClient` using `vi.mock` to ensure errors surface cleanly.
  - Implement route handler tests for `/auth/callback` and future secured endpoints.
  - Expand Playwright coverage with authenticated flows once Supabase local harness is in place; use fixtures for seeded data.
  - Record CI artifacts (`playwright-report/`, `.next/analyze`) for debugging regressions.

## 30 / 60 / 90 Day Roadmap

| Horizon | Focus | Key Outcomes | ROI | Effort |
| --- | --- | --- | --- | --- |
| 30 days | Stabilise foundations | Serverise layout & landing, secure `/api/messages`, add Supabase service-role helper, implement auth-protected middleware coverage. | ⭐⭐⭐ (unblocks prod deploy) | ⭐⭐ |
| 60 days | Ship real data layer | Replace `AppProvider` with Supabase queries + caching, stream search & dashboard data, migrate listing create/manage to server actions with RLS. | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 90 days | Performance & growth | Enforce JS budgets, add structured data & analytics events, introduce map lazy loading, run a11y sweeps, automate bundle reports in CI. | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

**Next steps**: Prioritise refactoring the app shell (issues 1–5) to cut hydration costs, then tackle security gaps in API/middleware and move CRUD flows off the mock context. Once the real data path is in place, iterate on performance budgets and growth instrumentation.
