-- Migration: Cleanup unused stub tables
-- These tables were created but never used in the UI
-- Dropping them to start fresh with the new Live Coaching schema

-- Drop in correct order (respecting foreign keys)
DROP TABLE IF EXISTS session_exercises;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS ai_generated_plans;
