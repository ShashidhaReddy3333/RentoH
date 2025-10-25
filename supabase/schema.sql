create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  prefs jsonb default '{}'::jsonb,
  notifications jsonb default '{"newMatches":true,"messages":true,"applicationUpdates":true}'::jsonb,
  verification_status text default 'pending' check (verification_status in ('verified','pending','unverified')),
  role text default 'tenant' check (role in ('tenant','landlord','admin')),
  created_at timestamptz default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  price integer not null,
  beds integer default 0,
  baths integer default 0,
  type text not null check (type in ('apartment','house','condo','townhouse')),
  city text not null,
  verified boolean default false,
  pets boolean default false,
  furnished boolean default false,
  smoking boolean default false,
  parking text,
  rent_frequency text,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  address text,
  postal_code text,
  description text,
  amenities jsonb default '[]'::jsonb,
  area integer,
  available_from date,
  neighborhood text,
  latitude double precision,
  longitude double precision,
  walk_score integer,
  transit_score integer,
  walkthrough_video_url text,
  status text default 'active' check (status in ('draft','active','archived')),
  is_featured boolean default false
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, property_id)
);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  other_party_id uuid references public.profiles(id),
  other_party_name text,
  other_party_avatar text,
  last_message text,
  unread_count integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  status text default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  applicant_id uuid references public.profiles(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  status text default 'submitted' check (status in ('draft','submitted','reviewing','interview','approved','rejected')),
  submitted_at timestamptz default now(),
  message text,
  monthly_income integer
);

-- New table to hold per-user notification preferences (email + SMS channels)
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications jsonb default '{"newMessages":true,"applications":true,"tours":true}'::jsonb,
  sms_notifications jsonb default '{"newMessages":false,"applications":false,"tours":false}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users manage their preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.favorites enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.tours enable row level security;
alter table public.applications enable row level security;

create policy "Users can view their profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Public listings are readable" on public.properties
  for select using (true);

create policy "Landlords manage their properties" on public.properties
  for all using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);

create policy "Users manage their favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Threads visible to owners" on public.message_threads
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Messages scoped to thread owner" on public.messages
  for select using (
    exists (
      select 1 from public.message_threads
      where message_threads.id = messages.thread_id
        and message_threads.owner_id = auth.uid()
    )
  );

create policy "Send messages for owned threads" on public.messages
  for insert with check (
    exists (
      select 1 from public.message_threads
      where message_threads.id = messages.thread_id
        and message_threads.owner_id = auth.uid()
    )
  );

create policy "Tenant tours readable" on public.tours
  for select using (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy "Tenant creates tours" on public.tours
  for insert with check (auth.uid() = tenant_id);

create policy "Landlord updates tours" on public.tours
  for update using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);

create policy "Applications visible to parties" on public.applications
  for select using (auth.uid() = applicant_id or auth.uid() = landlord_id);

create policy "Tenants create applications" on public.applications
  for insert with check (auth.uid() = applicant_id);

create policy "Landlords update applications" on public.applications
  for update using (auth.uid() = landlord_id) with check (auth.uid() = landlord_id);



