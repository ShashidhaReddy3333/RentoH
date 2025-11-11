create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  phone text,
  role text not null default 'tenant' check (role in ('tenant','landlord','admin')),
  verification_status text not null default 'pending' check (verification_status in ('verified','pending','unverified')),
  prefs jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{"newMatches":true,"messages":true,"applicationUpdates":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price integer not null,
  beds integer not null default 0,
  baths integer not null default 0,
  area integer,
  type text not null check (type in ('apartment','condo','house','townhouse')),
  address text,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  neighborhood text,
  images text[] not null default '{}',
  amenities text[] not null default '{}',
  pets boolean not null default false,
  smoking boolean not null default false,
  parking text,
  rent_frequency text not null default 'monthly' check (rent_frequency in ('monthly','weekly','biweekly')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  verified boolean not null default false,
  furnished boolean not null default false,
  available_from date,
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  walk_score integer,
  transit_score integer,
  walkthrough_video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  subject text,
  last_message text,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','submitted','reviewing','interview','approved','rejected')),
  submitted_at timestamptz,
  message text,
  monthly_income integer,
  created_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications jsonb not null default '{"newMessages":true,"applications":true,"tours":true}'::jsonb,
  sms_notifications jsonb not null default '{"newMessages":false,"applications":false,"tours":false}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_city_price on public.properties(city, price);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_landlord on public.properties(landlord_id);
create index if not exists idx_properties_featured on public.properties(is_featured);
create index if not exists idx_threads_updated_at on public.message_threads(updated_at desc);
create index if not exists idx_threads_participants on public.message_threads(tenant_id, landlord_id);
create index if not exists idx_messages_thread_created on public.messages(thread_id, created_at);
create index if not exists idx_applications_property on public.applications(property_id);
create index if not exists idx_applications_tenant on public.applications(tenant_id);
create index if not exists idx_applications_landlord on public.applications(landlord_id);
create index if not exists idx_tours_property on public.tours(property_id);
create index if not exists idx_tours_tenant on public.tours(tenant_id);
create index if not exists idx_tours_landlord on public.tours(landlord_id);
