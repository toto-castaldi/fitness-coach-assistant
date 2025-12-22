-- Coach AI Settings
-- Stores API keys and preferences for AI planning per coach

-- Coach AI Settings table
create table public.coach_ai_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  openai_api_key text,
  anthropic_api_key text,
  preferred_provider text not null default 'openai' check (preferred_provider in ('openai', 'anthropic')),
  preferred_model text not null default 'gpt-4o-mini',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index coach_ai_settings_user_id_idx on public.coach_ai_settings(user_id);

-- Enable RLS
alter table public.coach_ai_settings enable row level security;

-- RLS Policies: users can only access their own settings
create policy "Users can view their own AI settings"
  on public.coach_ai_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI settings"
  on public.coach_ai_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI settings"
  on public.coach_ai_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI settings"
  on public.coach_ai_settings for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger update_coach_ai_settings_updated_at
  before update on public.coach_ai_settings
  for each row
  execute function public.update_updated_at_column();
