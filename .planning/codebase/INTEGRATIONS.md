# External Integrations

**Analysis Date:** 2026-01-28

## APIs & External Services

**Docora (Repository Monitoring):**
- Docora API - Monitors GitHub repositories for changes and sends webhooks
  - SDK/Client: HTTP requests from Edge Function `supabase/functions/docora-webhook/`
  - Endpoint: Environment variable `DOCORA_API_URL` (production: `https://api.docora.toto-castaldi.com`)
  - Auth: Bearer token via environment variable `DOCORA_TOKEN`
  - App ID: `DOCORA_APP_ID` for webhook routing
  - Auth Key: `DOCORA_AUTH_KEY` for HMAC-SHA256 signature verification
  - Webhook path: `/functions/v1/docora-webhook` (Edge Function endpoint)
  - Use case: Automatically syncs markdown exercise cards from GitHub to database

**Model Context Protocol (MCP):**
- Helix MCP Server - Exposes resources and tools for AI integration
  - Endpoint: `supabase/functions/v1/helix-mcp` (Edge Function)
  - Auth: Custom API key (header `X-Helix-API-Key`) or OAuth 2.1 Bearer token
  - Protocol: JSON-RPC 2.0
  - Clients: Claude Desktop, Claude Web, Cursor, or any MCP-compatible LLM
  - Features: Read clients/sessions/exercises/goals, create/modify training sessions

## Data Storage

**Databases:**
- PostgreSQL 15 (Supabase managed)
  - Connection: `VITE_SUPABASE_URL` environment variable
  - Client: @supabase/supabase-js (Supabase SDK)
  - Local development: Docker container on port 54322
  - Backup: Automatic before each deploy (GitHub Actions artifact)

**File Storage:**
- Supabase Storage - `lumio-images` bucket
  - Purpose: Stores images from synced Lumio repository cards
  - Limits: 10MiB per file, public bucket
  - MIME types: image/jpeg, image/png, image/gif, image/webp
  - Path structure: `{userId}/{repositoryId}/{imagePath}`
  - Client library: `supabase.storage` API
  - Usage: Images parsed from markdown cards and stored during Docora webhook processing

**Caching:**
- Client-side browser cache (via Service Worker)
  - Supabase Auth endpoints: NetworkOnly (always fresh)
  - Supabase REST API: NetworkFirst (cache fallback)
  - Supabase Storage: CacheFirst (30-day expiry)
  - Lumio card endpoints: CacheFirst (7-day expiry)
- No server-side caching layer

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Google OAuth 2.0)
  - Implementation: `src/shared/hooks/useAuth.ts` → `supabase.auth.signInWithOAuth()`
  - Provider: Google OAuth
  - Redirect: Returns to `window.location.origin`
  - Session: JWT-based (3600s expiry in local, standard in production)
  - Refresh tokens: Automatic rotation enabled
  - State: React hook `useAuth()` manages user, session, loading states

**MCP Authentication (Milestone 12):**
- API Key method: SHA-256 hashed key stored in `coach_ai_settings.helix_mcp_api_key_hash`
  - Generation: User creates via Settings → MCP Integration
  - Verification: Edge Function compares SHA-256 hash
  - Transport: HTTP header `X-Helix-API-Key`
- OAuth 2.1 method (Claude Web): RFC 9728 Protected Resource Metadata
  - Discovery endpoint: `/.well-known/oauth-protected-resource`
  - Authorization: Supabase Auth (`/auth/v1`)
  - Consent page: `/oauth/consent` (handles auto-redirect for AI consent)
  - Bearer token: Standard Authorization header

**User Identity Storage:**
- Supabase auth.users table (managed by Supabase)
- Coach settings: `coach_ai_settings` table (one per user)
  - Fields: `user_id`, `helix_mcp_api_key_hash`, `openai_api_key`, `anthropic_api_key`, etc.
  - Location: `src/shared/types/index.ts` (types), database migrations

## Monitoring & Observability

**Error Tracking:**
- Not detected (application uses console logging only)

**Logs:**
- Console logging (browser dev tools for frontend)
- Supabase logs for Edge Functions (accessible via Dashboard)
- GitHub Actions logs for deployment pipeline
- Application errors tracked in React error boundaries (not explicitly visible)

**Analytics:**
- Not detected (no external analytics service configured)

## CI/CD & Deployment

**Hosting:**
- Digital Ocean Droplet
  - App deployed via SSH (easingthemes/ssh-deploy@v5.1.0)
  - Web server: Nginx (HTTPS via reverse proxy)
  - Domains: `helix.toto-castaldi.com` (main), `live.helix.toto-castaldi.com` (live)
  - Path: Configured via GitHub secrets `DEPLOY_PATH` and `DEPLOY_PATH_LIVE`

**Backend Hosting:**
- Supabase (managed PostgreSQL + Edge Functions)
  - Database: Automatic backups before migrations
  - Edge Functions: Auto-deployed via `supabase functions deploy` CLI
  - Storage: Automatic managed backups

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy.yml`)
  - Trigger: Push to `main` branch
  - Steps:
    1. Checkout code
    2. Generate version (date-based: `YYYY.MM.DD.HHMM`)
    3. Update README with version
    4. Setup Node.js 20 + npm cache
    5. Build main app (`npm run build`)
    6. Build live tablet app (`npm run build:live`)
    7. Deploy main app to Digital Ocean via SSH
    8. Deploy live app to Digital Ocean via SSH (separate path)
    9. Backup production database (SQL dump to GitHub Artifacts)
    10. Run Supabase migrations (`supabase db push`)
    11. Deploy all Edge Functions
  - Artifacts: Database backups retained 90 days
  - Git commits: Version updates committed and pushed automatically

**Supabase Edge Functions (Deployed):**
- `client-export` - Generates markdown export of client data for AI context
- `lumio-card` - Renders Lumio card markdown (deprecated, local cards via Docora)
- `lumio-sync-repo` - Manual repository sync (deprecated, automated via Docora)
- `docora-webhook` - Webhook handler for Docora (JWT verification disabled)
- `docora-register` - Register/unregister repository on Docora service
- `helix-mcp` - MCP server (JWT verification disabled, uses API key auth)

## Environment Configuration

**Required env vars (Frontend):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public key
- `VITE_APP_VERSION` - Set by GitHub Actions during build

**Required env vars (Local Google OAuth):**
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

**Required env vars (Edge Functions):**
- `DOCORA_API_URL` - Docora API endpoint
- `DOCORA_APP_ID` - Docora application ID
- `DOCORA_TOKEN` - Docora bearer token
- `DOCORA_AUTH_KEY` - Webhook signature verification key

**Secrets location:**
- Production: GitHub Secrets (`Settings → Secrets and variables → Actions`)
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `SSH_PRIVATE_KEY`, `REMOTE_HOST`, `REMOTE_USER`, `DEPLOY_PATH`, `DEPLOY_PATH_LIVE`
  - `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`
- Local development: `.env.local` (created from `.env.local.example`)
- Supabase Dashboard: Edge Function secrets (via Web UI)
  - `DOCORA_API_URL`, `DOCORA_APP_ID`, `DOCORA_TOKEN`, `DOCORA_AUTH_KEY`

## Webhooks & Callbacks

**Incoming:**
- Docora webhook: POST `/functions/v1/docora-webhook/{action}`
  - Actions: `create`, `update`, `delete` (appended to URL path)
  - Signature: HMAC-SHA256 in header `X-Docora-Signature`
  - Timestamp: Unix timestamp in header `X-Docora-Timestamp` (max 5 min old)
  - App ID: Header `X-Docora-App-Id` for routing
  - Payload: JSON with repository, file, commit_sha, previous_sha
  - Processing: Files chunked at 512KB, buffer in `docora_chunk_buffer` table

**Outgoing:**
- GitHub OAuth redirect: Returns to `window.location.origin` after login
- None detected for external APIs

## Third-Party Services

**GitHub Integration:**
- Repository URL parsing: `src/lib/github.ts`
  - Pattern matching for `github.com/{owner}/{repo}` URLs
  - No direct GitHub API calls (only via Docora monitoring)

**Google Cloud Platform:**
- OAuth provider via Supabase Auth
- Credentials managed in Supabase Dashboard
- No direct API calls

## Data Synchronization

**Repository Sync (Lumio + Docora):**
- Trigger: Docora webhook on GitHub push
- Flow: GitHub repo → Docora service → Edge Function webhook → PostgreSQL + Storage
- Markdown parsing: Extract frontmatter (YAML), content, math notation
- Image processing: Download images, resize, store in bucket
- Deduplication: Content hash (SHA-256) prevents duplicate syncs
- Chunking: Files >1MB split into 512KB chunks, reassembled on last chunk

**Real-time Updates:**
- PostgreSQL subscriptions: `supabase.from('table_name').on('*').subscribe()`
  - Used for: Session exercises, live coaching state
  - Enabled in migrations (Realtime extension)
  - Location: `src/shared/hooks/useLiveCoaching.ts`

**Local Development:**
- Supabase Docker stack: Full local backend
- Seed data: `supabase/seed.sql` with 15 default exercises
- Automatic reset: `npm run supabase:reset` applies migrations + seed

---

*Integration audit: 2026-01-28*
