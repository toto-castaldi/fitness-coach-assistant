-- Gyms table
create table public.gyms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.gyms enable row level security;

-- RLS Policies: users can only access their own gyms
create policy "Users can view their own gyms"
  on public.gyms for select
  using (auth.uid() = user_id);

create policy "Users can insert their own gyms"
  on public.gyms for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own gyms"
  on public.gyms for update
  using (auth.uid() = user_id);

create policy "Users can delete their own gyms"
  on public.gyms for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger update_gyms_updated_at
  before update on public.gyms
  for each row
  execute function public.update_updated_at_column();
