-- Exercises Blocks and Tags Schema
-- Extends the exercises table with blocks (image + description) and tags

-- Remove category column from exercises (replaced by tags)
alter table public.exercises drop column if exists category;

-- Exercise blocks table (images with descriptions)
create table public.exercise_blocks (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  image_url text,
  description text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- Exercise tags table
create table public.exercise_tags (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  tag text not null,
  created_at timestamp with time zone default now()
);

-- Add index for faster queries
create index exercise_blocks_exercise_id_idx on public.exercise_blocks(exercise_id);
create index exercise_tags_exercise_id_idx on public.exercise_tags(exercise_id);
create index exercise_tags_tag_idx on public.exercise_tags(tag);

-- Enable RLS
alter table public.exercise_blocks enable row level security;
alter table public.exercise_tags enable row level security;

-- RLS Policies for exercise_blocks (access through exercise ownership)
create policy "Users can view blocks of accessible exercises"
  on public.exercise_blocks for select
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_blocks.exercise_id
    and (exercises.user_id is null or exercises.user_id = auth.uid())
  ));

create policy "Users can insert blocks for their exercises"
  on public.exercise_blocks for insert
  with check (exists (
    select 1 from public.exercises
    where exercises.id = exercise_blocks.exercise_id
    and exercises.user_id = auth.uid()
  ));

create policy "Users can update blocks of their exercises"
  on public.exercise_blocks for update
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_blocks.exercise_id
    and exercises.user_id = auth.uid()
  ));

create policy "Users can delete blocks of their exercises"
  on public.exercise_blocks for delete
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_blocks.exercise_id
    and exercises.user_id = auth.uid()
  ));

-- RLS Policies for exercise_tags (access through exercise ownership)
create policy "Users can view tags of accessible exercises"
  on public.exercise_tags for select
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_tags.exercise_id
    and (exercises.user_id is null or exercises.user_id = auth.uid())
  ));

create policy "Users can insert tags for their exercises"
  on public.exercise_tags for insert
  with check (exists (
    select 1 from public.exercises
    where exercises.id = exercise_tags.exercise_id
    and exercises.user_id = auth.uid()
  ));

create policy "Users can update tags of their exercises"
  on public.exercise_tags for update
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_tags.exercise_id
    and exercises.user_id = auth.uid()
  ));

create policy "Users can delete tags of their exercises"
  on public.exercise_tags for delete
  using (exists (
    select 1 from public.exercises
    where exercises.id = exercise_tags.exercise_id
    and exercises.user_id = auth.uid()
  ));

-- Create storage bucket for exercise images
insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

-- Storage RLS Policies for exercise-images bucket

-- Policy per permettere a tutti di leggere le immagini (bucket pubblico)
create policy "Public read access for exercise images"
on storage.objects for select
using (bucket_id = 'exercise-images');

-- Policy per permettere agli utenti autenticati di caricare immagini nella propria cartella
create policy "Authenticated users can upload exercise images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy per permettere agli utenti di aggiornare le proprie immagini
create policy "Users can update own exercise images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy per permettere agli utenti di eliminare le proprie immagini
create policy "Users can delete own exercise images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
