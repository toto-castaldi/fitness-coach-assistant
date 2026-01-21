-- ============================================
-- Milestone 12: MCP Server API Key
-- ============================================
-- Adds API key field for MCP server authentication
-- The API key is stored as SHA-256 hash for security

ALTER TABLE public.coach_ai_settings
ADD COLUMN helix_mcp_api_key_hash text;

-- Index for fast lookup during authentication
CREATE INDEX coach_ai_settings_mcp_key_idx
ON public.coach_ai_settings(helix_mcp_api_key_hash)
WHERE helix_mcp_api_key_hash IS NOT NULL;

COMMENT ON COLUMN public.coach_ai_settings.helix_mcp_api_key_hash IS
'SHA-256 hash of the MCP API key for Claude Desktop/MCP client integration';
