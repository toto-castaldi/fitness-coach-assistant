-- Add card_url field to exercises table for external Lumio card support
-- When set, the external markdown card replaces local blocks in display
-- Local blocks remain as fallback if card is not available

ALTER TABLE public.exercises
ADD COLUMN card_url text;

COMMENT ON COLUMN public.exercises.card_url IS
  'URL to external Lumio markdown card (e.g., GitHub raw URL). When set, replaces local blocks in display.';
