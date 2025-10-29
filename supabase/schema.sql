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

create index if not exists idx_properties_city_price on public.properties(city, price);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_landlord on public.properties(landlord_id);
create index if not exists idx_properties_featured on public.properties(is_featured);

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

create index if not exists idx_threads_updated_at on public.message_threads(updated_at desc);
create index if not exists idx_threads_participants on public.message_threads(tenant_id, landlord_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_thread_created on public.messages(thread_id, created_at);

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

create index if not exists idx_applications_property on public.applications(property_id);
create index if not exists idx_applications_tenant on public.applications(tenant_id);
create index if not exists idx_applications_landlord on public.applications(landlord_id);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_tours_property on public.tours(property_id);
create index if not exists idx_tours_tenant on public.tours(tenant_id);
create index if not exists idx_tours_landlord on public.tours(landlord_id);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications jsonb not null default '{"newMessages":true,"applications":true,"tours":true}'::jsonb,
  sms_notifications jsonb not null default '{"newMessages":false,"applications":false,"tours":false}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_properties enable row level security;
alter table public.applications enable row level security;
alter table public.tours enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_upsert on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_read on public.profiles
  for select using (true);

create policy profiles_upsert on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists properties_read on public.properties;
drop policy if exists properties_insert on public.properties;
drop policy if exists properties_update on public.properties;
drop policy if exists properties_delete on public.properties;

create policy properties_read on public.properties
  for select using (true);

create policy properties_insert on public.properties
  for insert with check (auth.uid() = landlord_id);

create policy properties_update on public.properties
  for update using (auth.uid() = landlord_id);

create policy properties_delete on public.properties
  for delete using (auth.uid() = landlord_id);

drop policy if exists threads_read on public.message_threads;
drop policy if exists threads_insert on public.message_threads;
drop policy if exists threads_update on public.message_threads;

create policy threads_read on public.message_threads
  for select using (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy threads_insert on public.message_threads
  for insert with check (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy threads_update on public.message_threads
  for update using (auth.uid() = tenant_id or auth.uid() = landlord_id);

drop policy if exists messages_read on public.messages;
drop policy if exists messages_insert on public.messages;

create policy messages_read on public.messages
  for select using (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and (auth.uid() = t.tenant_id or auth.uid() = t.landlord_id)
    )
  );

create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and (auth.uid() = t.tenant_id or auth.uid() = t.landlord_id)
    )
  );

drop policy if exists fav_read on public.favorites;
drop policy if exists fav_write_ins on public.favorites;
drop policy if exists fav_write_upd on public.favorites;
drop policy if exists fav_write_del on public.favorites;

create policy fav_read on public.favorites
  for select using (auth.uid() = user_id);

create policy fav_write_ins on public.favorites
  for insert with check (auth.uid() = user_id);

create policy fav_write_upd on public.favorites
  for update using (auth.uid() = user_id);

create policy fav_write_del on public.favorites
  for delete using (auth.uid() = user_id);

drop policy if exists saved_read on public.saved_properties;
drop policy if exists saved_write_ins on public.saved_properties;
drop policy if exists saved_write_del on public.saved_properties;

create policy saved_read on public.saved_properties
  for select using (auth.uid() = user_id);

create policy saved_write_ins on public.saved_properties
  for insert with check (auth.uid() = user_id);

create policy saved_write_del on public.saved_properties
  for delete using (auth.uid() = user_id);

drop policy if exists apps_read_self on public.applications;
drop policy if exists apps_read_landlord on public.applications;
drop policy if exists apps_insert on public.applications;

create policy apps_read_self on public.applications
  for select using (auth.uid() = tenant_id);

create policy apps_read_landlord on public.applications
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.landlord_id = auth.uid()
    )
  );

create policy apps_insert on public.applications
  for insert with check (auth.uid() = tenant_id);

drop policy if exists tours_read_self on public.tours;
drop policy if exists tours_read_landlord on public.tours;
drop policy if exists tours_insert on public.tours;

create policy tours_read_self on public.tours
  for select using (auth.uid() = tenant_id);

create policy tours_read_landlord on public.tours
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.landlord_id = auth.uid()
    )
  );

create policy tours_insert on public.tours
  for insert with check (auth.uid() = tenant_id);

drop policy if exists prefs_read on public.user_preferences;
drop policy if exists prefs_upsert on public.user_preferences;
drop policy if exists prefs_update on public.user_preferences;

create policy prefs_read on public.user_preferences
  for select using (auth.uid() = user_id);

create policy prefs_upsert on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy prefs_update on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
