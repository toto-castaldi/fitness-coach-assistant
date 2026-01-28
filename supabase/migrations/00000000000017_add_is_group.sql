-- Add is_group flag to session_exercises for group exercise support
-- Milestone: Esercizi di Gruppo - Phase 1

ALTER TABLE public.session_exercises
  ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false;

-- Partial index for efficient filtering of group exercises
-- Only indexes rows where is_group = true (smaller, faster)
CREATE INDEX session_exercises_is_group_idx
  ON public.session_exercises(is_group)
  WHERE is_group = true;
