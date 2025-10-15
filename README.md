# Rento Bridge

Production-ready starter for the Rento Bridge rental marketplace. Built with Next.js App Router, TypeScript, Tailwind, and Supabase-friendly wiring.

## Quick Start

```bash
npm i
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with the shared config |
| `npm run typecheck` | TypeScript project check (no emit) |
| `npm run test` | Execute Vitest unit tests |
| `npm run e2e` | Execute Playwright e2e tests |
| `npm run analyze` | Build with bundle analyzer enabled |

## Environment

Environment variables are validated via `lib/env.ts` with Zod. Required keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Populate `.env.local` with your Supabase project values.

## Supabase Integration

- `lib/supabase/client.ts` and `lib/supabase/server.ts` expose browser/server clients.
- `lib/data/properties.ts` contains a typed data helper used by `/api/properties` and `app/browse/page.tsx`.
- API route `app/api/properties/route.ts` serves cached property data for the UI.

### SQL Seed

Run the following in the Supabase SQL editor to provision tables, policies, and sample data:

```sql
-- Properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  price integer not null check (price >= 0),
  image_url text,
  city text not null default 'Waterloo',
  landlord_id uuid references auth.users(id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  thread_id uuid not null,
  sender_id uuid references auth.users(id),
  body text not null
);

-- Enable RLS
alter table public.properties enable row level security;
alter table public.messages enable row level security;

-- Policies
create policy "Public can read properties"
on public.properties for select
to anon
using ( true );

create policy "Authenticated can insert properties"
on public.properties for insert
to authenticated
with check ( auth.role() = 'authenticated' );

create policy "Auth read messages"
on public.messages for select
to authenticated
using ( true );

create policy "Auth write messages"
on public.messages for insert
to authenticated
with check ( auth.role() = 'authenticated' );

-- Seed
insert into public.properties (title, price, image_url, city)
values
('Modern Studio near UW', 1450, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200', 'Waterloo'),
('1BR with Balcony', 1725, 'https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?w=1200', 'Kitchener'),
('Bright 2BR Downtown', 2350, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200', 'Waterloo');
```

## Design System & Theming

- Tailwind tokens extend semantic colors under `brand`, `surface`, and `textc` with dark mode handled by `:root`/`.dark` CSS variables.
- Glassmorphism and soft shadows are shared through the `Card` and `Button` primitives in `components/ui`.
- `app/theme-provider.tsx` syncs user preference, local storage, and system theme.

## API Overview

- `GET /api/properties` — returns `{ items: Property[] }` via Supabase.
- `app/browse/page.tsx` demonstrates a server-rendered property feed using the same data layer.

## Auth & Middleware

`middleware.ts` redirects unauthenticated visitors from `/dashboard` and `/messages` to `/auth/sign-in` unless a `rento_auth=1` cookie is present. Update this stub when wiring real Supabase auth.

## Testing

- Vitest (unit): colocated in `__tests__/` with Testing Library helpers.
- Playwright (e2e): smoke test targeting the home page (`e2e/smoke.spec.ts`).

Run the full suite with:

```bash
npm run typecheck && npm run lint
npm test
npm run e2e
```
