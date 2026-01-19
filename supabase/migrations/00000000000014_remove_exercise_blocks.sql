-- Migration: Remove exercise blocks system
-- The exercise description will now be provided only by Lumio cards

-- Drop exercise_blocks table (CASCADE removes indexes and RLS policies)
DROP TABLE IF EXISTS public.exercise_blocks CASCADE;

-- Remove exercise-images storage bucket (used only for block images)
-- First delete all objects in the bucket, then delete the bucket
DELETE FROM storage.objects WHERE bucket_id = 'exercise-images';
DELETE FROM storage.buckets WHERE id = 'exercise-images';
