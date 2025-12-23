-- Add skipped field to session_exercises
-- Tracks when an exercise is skipped during live coaching

alter table public.session_exercises
  add column skipped boolean not null default false;
