-- Migration: Remove external card URL feature
-- Exercises will only use local Lumio cards (synced via Docora)

-- Remove card_url column from exercises table
ALTER TABLE public.exercises DROP COLUMN IF EXISTS card_url;
