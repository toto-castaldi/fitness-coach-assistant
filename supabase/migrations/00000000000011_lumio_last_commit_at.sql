-- Migration: Add last_commit_at to lumio_repositories
-- Stores the date of the last commit in the GitHub repository

ALTER TABLE lumio_repositories
ADD COLUMN last_commit_at timestamptz;

-- Add index for sorting by last update
CREATE INDEX lumio_repositories_last_commit_at_idx ON lumio_repositories (last_commit_at);
