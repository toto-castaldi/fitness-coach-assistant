-- Fitness Coach Assistant - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients table
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  current_goal text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Goal history table
create table public.goal_history (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  goal text not null,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone
);

-- Exercises catalog table
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text,
  description text,
  created_at timestamp with time zone default now()
);

-- Training sessions table
create table public.training_sessions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  session_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

-- Session exercises table
create table public.session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.training_sessions(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  sets integer,
  reps text,
  weight text,
  notes text,
  order_index integer default 0
);

-- AI generated plans table
create table public.ai_generated_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  generated_at timestamp with time zone default now(),
  ai_provider text not null,
  prompt_used text,
  plan_content text not null,
  accepted boolean default false
);

-- Row Level Security Policies

-- Enable RLS on all tables
alter table public.clients enable row level security;
alter table public.goal_history enable row level security;
alter table public.exercises enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.ai_generated_plans enable row level security;

-- Clients: users can only access their own clients
create policy "Users can view their own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Goal history: access through client ownership
create policy "Users can view goal history of their clients"
  on public.goal_history for select
  using (exists (
    select 1 from public.clients
    where clients.id = goal_history.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can insert goal history for their clients"
  on public.goal_history for insert
  with check (exists (
    select 1 from public.clients
    where clients.id = goal_history.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can update goal history of their clients"
  on public.goal_history for update
  using (exists (
    select 1 from public.clients
    where clients.id = goal_history.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can delete goal history of their clients"
  on public.goal_history for delete
  using (exists (
    select 1 from public.clients
    where clients.id = goal_history.client_id
    and clients.user_id = auth.uid()
  ));

-- Exercises: users can see default exercises (user_id is null) and their own
create policy "Users can view default and own exercises"
  on public.exercises for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Training sessions: access through client ownership
create policy "Users can view sessions of their clients"
  on public.training_sessions for select
  using (exists (
    select 1 from public.clients
    where clients.id = training_sessions.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can insert sessions for their clients"
  on public.training_sessions for insert
  with check (exists (
    select 1 from public.clients
    where clients.id = training_sessions.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can update sessions of their clients"
  on public.training_sessions for update
  using (exists (
    select 1 from public.clients
    where clients.id = training_sessions.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can delete sessions of their clients"
  on public.training_sessions for delete
  using (exists (
    select 1 from public.clients
    where clients.id = training_sessions.client_id
    and clients.user_id = auth.uid()
  ));

-- Session exercises: access through session -> client ownership
create policy "Users can view exercises of their sessions"
  on public.session_exercises for select
  using (exists (
    select 1 from public.training_sessions ts
    join public.clients c on c.id = ts.client_id
    where ts.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));

create policy "Users can insert exercises in their sessions"
  on public.session_exercises for insert
  with check (exists (
    select 1 from public.training_sessions ts
    join public.clients c on c.id = ts.client_id
    where ts.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));

create policy "Users can update exercises of their sessions"
  on public.session_exercises for update
  using (exists (
    select 1 from public.training_sessions ts
    join public.clients c on c.id = ts.client_id
    where ts.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));

create policy "Users can delete exercises of their sessions"
  on public.session_exercises for delete
  using (exists (
    select 1 from public.training_sessions ts
    join public.clients c on c.id = ts.client_id
    where ts.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));

-- AI generated plans: access through client ownership
create policy "Users can view plans of their clients"
  on public.ai_generated_plans for select
  using (exists (
    select 1 from public.clients
    where clients.id = ai_generated_plans.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can insert plans for their clients"
  on public.ai_generated_plans for insert
  with check (exists (
    select 1 from public.clients
    where clients.id = ai_generated_plans.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can update plans of their clients"
  on public.ai_generated_plans for update
  using (exists (
    select 1 from public.clients
    where clients.id = ai_generated_plans.client_id
    and clients.user_id = auth.uid()
  ));

create policy "Users can delete plans of their clients"
  on public.ai_generated_plans for delete
  using (exists (
    select 1 from public.clients
    where clients.id = ai_generated_plans.client_id
    and clients.user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for clients updated_at
create trigger update_clients_updated_at
  before update on public.clients
  for each row
  execute function public.update_updated_at_column();

-- Insert some default exercises
insert into public.exercises (user_id, name, category) values
  (null, 'Squat', 'legs'),
  (null, 'Deadlift', 'legs'),
  (null, 'Leg Press', 'legs'),
  (null, 'Leg Curl', 'legs'),
  (null, 'Leg Extension', 'legs'),
  (null, 'Calf Raise', 'legs'),
  (null, 'Bench Press', 'chest'),
  (null, 'Incline Bench Press', 'chest'),
  (null, 'Dumbbell Fly', 'chest'),
  (null, 'Push-up', 'chest'),
  (null, 'Cable Crossover', 'chest'),
  (null, 'Pull-up', 'back'),
  (null, 'Lat Pulldown', 'back'),
  (null, 'Barbell Row', 'back'),
  (null, 'Dumbbell Row', 'back'),
  (null, 'Seated Cable Row', 'back'),
  (null, 'Shoulder Press', 'shoulders'),
  (null, 'Lateral Raise', 'shoulders'),
  (null, 'Front Raise', 'shoulders'),
  (null, 'Rear Delt Fly', 'shoulders'),
  (null, 'Bicep Curl', 'arms'),
  (null, 'Hammer Curl', 'arms'),
  (null, 'Tricep Pushdown', 'arms'),
  (null, 'Tricep Dip', 'arms'),
  (null, 'Skull Crusher', 'arms'),
  (null, 'Plank', 'core'),
  (null, 'Crunch', 'core'),
  (null, 'Russian Twist', 'core'),
  (null, 'Leg Raise', 'core'),
  (null, 'The Hundred', 'pilates'),
  (null, 'Roll Up', 'pilates'),
  (null, 'Single Leg Circle', 'pilates'),
  (null, 'Rolling Like a Ball', 'pilates'),
  (null, 'Single Leg Stretch', 'pilates'),
  (null, 'Double Leg Stretch', 'pilates'),
  (null, 'Spine Stretch', 'pilates'),
  (null, 'Saw', 'pilates'),
  (null, 'Swan', 'pilates'),
  (null, 'Swimming', 'pilates'),
  (null, 'Teaser', 'pilates');
