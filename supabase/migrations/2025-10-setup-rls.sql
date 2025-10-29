-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles self access"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- LISTINGS
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  city text,
  address text,
  rent integer,
  beds integer,
  baths integer,
  area integer,
  type text check (type in ('apartment','house','condo','townhouse')),
  pets boolean,
  furnished boolean,
  available_from date,
  amenities text[] default '{}',
  cover text,
  images text[] default '{}',
  status text not null default 'draft'
    check (status in ('draft','published','paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.listings enable row level security;
create policy "public can read published listings"
  on public.listings for select using (status = 'published');
create policy "owner can manage own listings"
  on public.listings for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- FAVORITES
create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "favorites self access"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- THREADS & MESSAGES
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz default now()
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
alter table public.threads enable row level security;
alter table public.messages enable row level security;
create policy "threads participants access"
  on public.threads for all
  using (auth.uid() in (landlord_id, tenant_id))
  with check (auth.uid() in (landlord_id, tenant_id));
create policy "messages participants access"
  on public.messages for all
  using (
    exists (select 1 from public.threads t
            where t.id = messages.thread_id
              and auth.uid() in (t.landlord_id, t.tenant_id))
  )
  with check (
    exists (select 1 from public.threads t
            where t.id = thread_id
              and auth.uid() in (t.landlord_id, t.tenant_id)
              and auth.uid() = sender_id)
  );

-- STORAGE bucket
insert into storage.buckets (id,name,public)
values ('listing-media','listing-media',true)
on conflict (id) do nothing;
create policy "public read listing-media"
  on storage.objects for select
  using (bucket_id='listing-media');
create policy "owner write/delete own prefix"
  on storage.objects for all
  using (
    bucket_id='listing-media'
    and left(name,36)=auth.uid()::text
  )
  with check (
    bucket_id='listing-media'
    and left(name,36)=auth.uid()::text
  );
