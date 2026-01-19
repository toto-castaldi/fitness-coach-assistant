-- Migration: Docora Integration - Milestone 10
-- Adds support for Docora webhook-based repository synchronization

-- ============================================
-- LUMIO REPOSITORIES - Add Docora mapping
-- ============================================

-- Add docora_repository_id for mapping with Docora service
ALTER TABLE lumio_repositories
ADD COLUMN docora_repository_id text;

-- Unique index for fast lookup by Docora ID
CREATE UNIQUE INDEX lumio_repositories_docora_id_idx
ON lumio_repositories (docora_repository_id)
WHERE docora_repository_id IS NOT NULL;

-- ============================================
-- DOCORA CHUNK BUFFER
-- For handling chunked file uploads > 1MB
-- ============================================

CREATE TABLE public.docora_chunk_buffer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id text NOT NULL,              -- UUID from Docora webhook
  repository_id uuid NOT NULL REFERENCES public.lumio_repositories(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  chunk_index integer NOT NULL,
  chunk_total integer NOT NULL,
  content text NOT NULL,               -- Partial content (base64 or text)
  content_encoding text,               -- 'base64' if binary
  commit_sha text,
  timestamp timestamptz,               -- From webhook payload
  previous_sha text,                   -- For updates
  created_at timestamptz DEFAULT now(),

  UNIQUE(chunk_id, chunk_index)
);

-- Index for cleanup of old chunks (> 10 minutes)
CREATE INDEX docora_chunk_buffer_created_idx ON docora_chunk_buffer (created_at);

-- Index for fast chunk assembly
CREATE INDEX docora_chunk_buffer_chunk_id_idx ON docora_chunk_buffer (chunk_id);

-- No RLS needed - this table is only accessed by Edge Functions with service role
-- But we enable it for consistency and add a permissive policy for service role

ALTER TABLE public.docora_chunk_buffer ENABLE ROW LEVEL SECURITY;

-- Edge Functions use service role key which bypasses RLS
-- This policy is for documentation/consistency purposes
CREATE POLICY "Service role full access on chunk buffer"
  ON public.docora_chunk_buffer
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CLEANUP FUNCTION
-- Automatically delete chunks older than 10 minutes
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_chunks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM docora_chunk_buffer
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$;

-- Comment for documentation
COMMENT ON TABLE docora_chunk_buffer IS 'Temporary buffer for Docora chunked file uploads (files > 1MB)';
COMMENT ON COLUMN lumio_repositories.docora_repository_id IS 'Docora service repository ID for webhook mapping';
