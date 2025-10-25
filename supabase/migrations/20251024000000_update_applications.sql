-- Add timeline and notes fields to applications table
alter table public.applications 
add column if not exists notes text,
add column if not exists timeline jsonb default '[]'::jsonb,
add column if not exists updated_at timestamptz default now();

-- Create a function to update the timeline
create or replace function public.update_application_timeline()
returns trigger as $$
begin
  if OLD.status != NEW.status then
    NEW.timeline = OLD.timeline || jsonb_build_object(
      'status', NEW.status,
      'timestamp', now(),
      'note', coalesce(NEW.notes, '')
    );
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the timeline
create trigger update_application_timeline
  before update on public.applications
  for each row
  execute function public.update_application_timeline();