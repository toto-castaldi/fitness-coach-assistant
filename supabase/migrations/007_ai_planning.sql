-- AI Planning Schema
-- Tables for AI-powered session planning via chat

-- AI Conversations table (container for chat sessions)
create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- AI Messages table (individual messages in a conversation)
create table public.ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- AI Generated Plans table (plans proposed by AI, can become sessions)
create table public.ai_generated_plans (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete set null,
  plan_json jsonb not null,
  accepted boolean default false,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index ai_conversations_user_id_idx on public.ai_conversations(user_id);
create index ai_conversations_client_id_idx on public.ai_conversations(client_id);
create index ai_conversations_created_at_idx on public.ai_conversations(created_at desc);
create index ai_messages_conversation_id_idx on public.ai_messages(conversation_id);
create index ai_messages_created_at_idx on public.ai_messages(created_at);
create index ai_generated_plans_conversation_id_idx on public.ai_generated_plans(conversation_id);
create index ai_generated_plans_session_id_idx on public.ai_generated_plans(session_id);

-- Enable RLS
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_generated_plans enable row level security;

-- RLS Policies for ai_conversations (users can only access their own)
create policy "Users can view their own conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- RLS Policies for ai_messages (access through conversation ownership)
create policy "Users can view messages of their conversations"
  on public.ai_messages for select
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can insert messages in their conversations"
  on public.ai_messages for insert
  with check (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can update messages of their conversations"
  on public.ai_messages for update
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can delete messages of their conversations"
  on public.ai_messages for delete
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

-- RLS Policies for ai_generated_plans (access through conversation ownership)
create policy "Users can view plans of their conversations"
  on public.ai_generated_plans for select
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_generated_plans.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can insert plans in their conversations"
  on public.ai_generated_plans for insert
  with check (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_generated_plans.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can update plans of their conversations"
  on public.ai_generated_plans for update
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_generated_plans.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

create policy "Users can delete plans of their conversations"
  on public.ai_generated_plans for delete
  using (exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = ai_generated_plans.conversation_id
    and ai_conversations.user_id = auth.uid()
  ));

-- Trigger for updated_at on ai_conversations
create trigger update_ai_conversations_updated_at
  before update on public.ai_conversations
  for each row
  execute function public.update_updated_at_column();
