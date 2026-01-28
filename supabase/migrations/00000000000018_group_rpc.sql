-- Migration: Add RPC functions for group exercise operations and enable realtime
-- Phase: 04-ui-live-tablet
-- Purpose: Support atomic group exercise completion and individual skips for tablet live UI

-- ============================================================================
-- RPC Function: complete_group_exercise
-- Marks all group exercises matching date + exercise_id as completed atomically
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_group_exercise(
  p_session_date DATE,
  p_exercise_id UUID
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  UPDATE public.session_exercises se
  SET
    completed = true,
    completed_at = v_completed_at,
    skipped = false
  FROM public.sessions s
  WHERE se.session_id = s.id
    AND s.session_date = p_session_date
    AND se.exercise_id = p_exercise_id
    AND se.is_group = true
    AND se.completed = false
  RETURNING se.id AS updated_id;
END;
$$;

-- ============================================================================
-- RPC Function: skip_group_exercise_for_client
-- Marks a single group exercise as skipped for one client
-- ============================================================================
CREATE OR REPLACE FUNCTION public.skip_group_exercise_for_client(
  p_session_exercise_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.session_exercises
  SET
    skipped = true,
    completed = false,
    completed_at = NULL
  WHERE id = p_session_exercise_id
    AND is_group = true;
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- Grant execute permissions to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.complete_group_exercise(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_group_exercise_for_client(UUID) TO authenticated;

-- ============================================================================
-- Enable realtime on session_exercises for cross-tablet sync
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE session_exercises;
ALTER TABLE session_exercises REPLICA IDENTITY FULL;
