-- Create tour_slots table
create table if not exists public.tour_slots (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'available' check (status in ('available', 'booked', 'cancelled')),
  created_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- Add RLS policies for tour_slots
alter table public.tour_slots enable row level security;

-- Landlords can manage their tour slots
create policy "Landlords manage tour slots" on public.tour_slots
  for all using (auth.uid() = landlord_id) 
  with check (auth.uid() = landlord_id);

-- Tour slots are publicly readable
create policy "Tour slots are readable" on public.tour_slots
  for select using (true);

-- Add trigger to update tour when slot is booked
create or replace function public.book_tour_slot()
returns trigger as $$
begin
  -- Create a tour entry when slot is booked
  if NEW.status = 'booked' and OLD.status = 'available' then
    insert into public.tours (
      property_id,
      landlord_id,
      tenant_id,
      scheduled_at,
      status
    ) values (
      NEW.property_id,
      NEW.landlord_id,
      auth.uid(),
      NEW.start_time,
      'confirmed'
    );
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_tour_slot_booked
  after update on public.tour_slots
  for each row
  when (NEW.status = 'booked' and OLD.status = 'available')
  execute function public.book_tour_slot();