# Codebase Concerns

**Analysis Date:** 2026-01-28

## Tech Debt

**OAuth Consent Debugging Logs in Production:**
- Issue: `OAuthConsent.tsx` contains multiple console.log statements for OAuth flow debugging (lines 38, 40, 54, 98-99, 113, 125, etc.)
- Files: `src/pages/OAuthConsent.tsx`
- Impact: Sensitive information like authorization IDs and access token prefixes logged to browser console in production. Could expose OAuth flow details to users/browsers.
- Fix approach: Remove all console.log statements. Keep console.error for actual failures only. Consider structured error handling without logging auth details.

**Type Safety Issues in Exercise Data Mapping:**
- Issue: Line 77 in `useExercises.ts` uses `as unknown as { status: string }` to handle Supabase join result, indicating weak typing for complex queries
- Files: `src/hooks/useExercises.ts`
- Impact: No compile-time safety for session_exercises inner join structure. Future schema changes could break silently.
- Fix approach: Create proper TypeScript interface for the Supabase join query result type to ensure type safety.

**Loose Frontmatter Type Definition:**
- Issue: `LumioLocalCardFrontmatter` interface uses `[key: string]: unknown` (line 333 in shared/types/index.ts), allowing any properties
- Files: `src/shared/types/index.ts`
- Impact: No validation of frontmatter structure from Lumio cards. Invalid or missing frontmatter properties could cause runtime errors.
- Fix approach: Define explicit fields for frontmatter with proper types (tags, difficulty, language as required, others as optional).

**console.error Statements Without Error Standardization:**
- Issue: Multiple files use console.error for logging failures but inconsistently (Docora registration, storage operations, auth)
- Files: `src/shared/lib/liveCoachingStorage.ts`, `src/hooks/useRepositories.ts`, `src/pages/OAuthConsent.tsx`, and others
- Impact: Production error logs polluted with console messages. No centralized error tracking or observability.
- Fix approach: Implement error logging strategy (remove console logs or use proper logging service). Standardize error handling patterns.

## Known Bugs

**Live Coaching State Stale Data Not Cleaned in localStorage:**
- Symptoms: Stale sessions from >24 hours ago stay in memory until explicitly cleared or user manually clears localStorage
- Files: `src/shared/lib/liveCoachingStorage.ts`
- Trigger: Load live coaching state after >24 hours from initial save
- Current behavior: Returns null and clears, but manual localStorage cleanup on failed loads could leak stale data if localStorage access fails
- Workaround: Manually clear browser localStorage if experiencing unexpected old session resumption

**Docora Registration Failure Silently Allows Repository Creation:**
- Symptoms: Repository is created in database even if Docora registration fails
- Files: `src/hooks/useRepositories.ts` (lines 99-132)
- Trigger: Network failure or Docora API error during createRepository
- Current state: Try-catch at line 129 catches and logs error but doesn't fail the operation. Comment says "Don't fail" but this can lead to partially configured repositories
- Impact: Repositories can exist without Docora webhooks, breaking automatic sync assumption
- Mitigation: Manual registration via "Attiva sync automatico" button expected to fix partial registrations

**Missing Error Boundary for Live Coaching Session Recovery:**
- Symptoms: If session data becomes inconsistent during live coaching (e.g., exercise deleted externally), UI may show stale data
- Files: `src/shared/hooks/useLiveCoaching.ts` (optimistic updates without full rollback)
- Trigger: Concurrent external updates during live session, or database inconsistency
- Current state: Optimistic updates applied immediately; if save fails, state not reverted to server state
- Impact: UI can diverge from server state if network fails during exercise completion

**OAuth Auto-Redirect Condition May Redirect Twice:**
- Symptoms: User redirected to data.redirect_url if consent already given (line 53-56 in OAuthConsent.tsx)
- Files: `src/pages/OAuthConsent.tsx`
- Trigger: User visits /oauth/consent after already approving the OAuth client
- Current behavior: Auto-redirect without checking if location change completed
- Risk: Race condition if redirect happens while component unmounting

## Security Considerations

**API Key Exposure in Docora Registration Calls:**
- Risk: `access_token` from GitHub OAuth passed unencrypted in request body to docora-register function
- Files: `src/hooks/useRepositories.ts` (line 107)
- Current mitigation: Transmitted over HTTPS only, token should be private
- Recommendation: Verify token isn't logged in function logs or error messages. Consider token encryption at rest in database.

**MCP API Key Stored as Hash Without Salt:**
- Risk: SHA-256 hashing without salt makes keys vulnerable to rainbow table attacks if database breached
- Files: `src/hooks/useAISettings.ts` (lines 6-12), `supabase/functions/helix-mcp/index.ts` (lines 58-64)
- Current state: Client-side SHA-256 hash, server-side comparison of hashes
- Recommendation: Use bcrypt or similar password hashing library with salt/rounds. Current approach is database-specific vulnerability.

**OAuth Authorization Details Logged in Console:**
- Risk: Authorization ID, access token prefixes, and redirect URLs visible in browser console logs
- Files: `src/pages/OAuthConsent.tsx`
- Impact: If user shares console logs or screenshot, OAuth flow details exposed
- Recommendation: Remove all console.log calls for auth data. Log only generic messages like "auth_in_progress".

**localStorage Used for Live Coaching State:**
- Risk: Session IDs and coaching metadata stored in localStorage, visible to XSS attacks
- Files: `src/shared/lib/liveCoachingStorage.ts`
- Current state: No encryption, plain JSON in localStorage
- Mitigation: Session-only storage (lost on browser close), no sensitive user data
- Recommendation: Consider moving to sessionStorage if XSS risk high, or encrypt localStorage values.

## Performance Bottlenecks

**Large useExercises Query Without Pagination:**
- Problem: Fetches all exercises, tags, sessions, and lumio_cards in three Promise.all calls
- Files: `src/hooks/useExercises.ts` (lines 47-62)
- Cause: Loads entire exercise catalog into React state on every fetch
- Scale limit: >1000 exercises will cause UI lag and memory pressure
- Improvement path: Implement pagination or virtual scrolling. Lazy-load lumio_cards only when displayed.

**useLiveCoaching Hook Accepts/Processes Full Session Trees:**
- Problem: Loads all session_exercises with full exercise details and lumio_cards recursively
- Files: `src/shared/hooks/useLiveCoaching.ts` (lines 54-64)
- Cause: Single large `.select('*')` join with nested relations
- Scale limit: 100+ exercises in a session will cause slowdown in update operations
- Improvement path: Lazy-load exercise details only for current session. Batch update operations with debouncing.

**Repository Realtime Subscription Without Unsubscribe on Error:**
- Problem: Realtime channel subscribed but error handling missing if subscribe fails
- Files: `src/hooks/useRepositories.ts` (lines 37-74)
- Cause: No error handler in channel subscription
- Impact: Silent subscription failures, user doesn't know realtime updates aren't working
- Improvement: Add `.on('error', (err) => {})` handler and set error state.

## Fragile Areas

**Live Coaching Optimistic Update Without Rollback:**
- Files: `src/shared/hooks/useLiveCoaching.ts`, `src/components/live/LiveExerciseControl.tsx`
- Why fragile: Optimistic updates (lines 94-106, 137-151) applied to state before server confirmation. If save fails, no rollback to previous state.
- Safe modification: Always fetch fresh data on error or implement proper rollback by storing previous state before update.
- Test coverage: No test cases for network failure scenarios during exercise completion/skip.

**Session Exercise Reordering Logic Complex:**
- Files: `src/shared/hooks/useLiveCoaching.ts` (lines 503-577 addExerciseToSession), `src/components/sessions/SessionExerciseCard.tsx`
- Why fragile: Order index management requires multiple sequential database updates (lines 536-544). If one fails mid-operation, indices become inconsistent.
- Safe modification: Wrap reordering in transaction or verify consistency after each update.
- Test coverage: No tests for edge cases (adding to first position, last position, empty sessions).

**OAuthConsent Page Error Handling:**
- Files: `src/pages/OAuthConsent.tsx`
- Why fragile: Error states fall back to URL params (lines 45-49, 68-72) if Supabase call fails. Multiple error paths with different fallback behavior.
- Safe modification: Consolidate error handling. Clearly document fallback behavior. Test all error scenarios.
- Test coverage: No test cases for network failures, invalid authorization_id, or token expiry.

**Docora Integration Partially Async:**
- Files: `src/hooks/useRepositories.ts` (deleteRepository function, lines 161-193)
- Why fragile: Tries to unregister from Docora but continues with database deletion even if unregister fails (lines 173-174). Database deletion can't be rolled back.
- Safe modification: Wait for Docora unregister success before deleting from DB, or implement soft delete with cleanup job.
- Test coverage: No test for what happens if Docora unregister fails.

## Scaling Limits

**Supabase PostgreSQL Row Count Limit:**
- Current capacity: 1000 rows max returned per query (supabase/config.toml line 9)
- Limit: 1000 exercises, sessions, or repositories
- Scaling path: Implement pagination in useExercises, useSessions, useRepositories hooks. Use LIMIT/OFFSET or cursor-based pagination.

**localStorage Size Limit:**
- Current capacity: ~5-10MB per domain (browser-dependent)
- Limit: Live coaching state will accumulate if not cleaned up
- Scaling path: Implement active cleanup. Move to IndexedDB if state grows beyond localStorage limits.

**Lumio Card Image Storage:**
- Current capacity: 10MiB per image (supabase/config.toml line 40), 50MiB file size limit
- Limit: Large repositories with many high-res images will hit storage limits
- Scaling path: Implement image optimization pipeline. Compress/resize on upload. Implement storage cleanup for removed cards.

**Docora Chunk Buffer Temporary Storage:**
- Current capacity: Files split into 512KB chunks, assembled on last chunk (CLAUDE.md)
- Limit: Files >512MB may accumulate stale chunks in docora_chunk_buffer if last chunk never arrives
- Scaling path: Implement 10-minute cleanup job. Add chunk validation/checksum verification.

## Dependencies at Risk

**Supabase Auth OAuth 2.1 Implementation (Milestone 12):**
- Risk: OAuth implementation recently added for Claude Web integration. Uses non-standard RFC 9728 Protected Resource Metadata endpoint discovery.
- Impact: Breaking changes if Supabase changes auth API or RFC 9728 changes
- Migration plan: Monitor Supabase changelog. Test OAuth consent flow after any Supabase auth updates. Have fallback to API key auth.

**Docora External Service Dependency:**
- Risk: Automatic sync relies on Docora webhook deliveries. No retry mechanism if webhook fails.
- Impact: Card updates missed if Docora fails
- Migration plan: Implement polling fallback. Store webhook delivery status. Provide manual sync button.

**GitHub API Rate Limits:**
- Risk: When registering repository with Docora, GitHub token is passed but rate limits could block updates
- Impact: Sync failures if user hits GitHub API limits
- Migration plan: Implement rate limit detection. Warn users before registering large repos.

## Missing Critical Features

**No Error Recovery for Failed Docora Sync:**
- Problem: If Docora webhook fails, cards won't sync. No UI indication of sync failure.
- Blocks: Cannot guarantee repositories stay in sync without manual intervention
- Solution: Add sync status indicator and manual retry button. Implement webhook delivery confirmation.

**No Undo/Revision History for Exercise Changes:**
- Problem: When exercise is updated during live coaching, old values lost immediately
- Blocks: Cannot recover previous parameters if wrong value accidentally saved
- Solution: Implement soft deletes or versioning. Add undo/redo UI.

**No Session Conflict Detection:**
- Problem: Two coaches can modify same session simultaneously without conflict detection
- Blocks: Risk of data loss due to last-write-wins behavior
- Solution: Implement optimistic locking with version numbers or conflict resolution UI.

## Test Coverage Gaps

**Live Coaching Network Failures:**
- What's not tested: What happens if save fails during exercise completion/skip/update
- Files: `src/shared/hooks/useLiveCoaching.ts`, all exercise update methods
- Risk: UI state diverges from server state silently
- Priority: High

**OAuth Consent Flow Error Paths:**
- What's not tested: Network failures, invalid tokens, expired sessions, Supabase API errors
- Files: `src/pages/OAuthConsent.tsx`
- Risk: User stuck on blank page with no error message
- Priority: High

**Session Exercise Reordering Concurrency:**
- What's not tested: What happens if two clients reorder exercises simultaneously
- Files: `src/hooks/useSessions.ts`, live exercise management
- Risk: Database order indices become inconsistent
- Priority: Medium

**Docora Webhook Chunking Edge Cases:**
- What's not tested: Missing last chunk, out-of-order chunks, duplicate chunks
- Files: `supabase/functions/docora-webhook`
- Risk: Partial files saved to database
- Priority: Medium

**Repository Management with External Sync:**
- What's not tested: Create/delete repository while Docora sync in progress
- Files: `src/hooks/useRepositories.ts`
- Risk: Orphaned repositories or cards
- Priority: Medium

**Realtime Subscription Failures:**
- What's not tested: Realtime channel subscription failures, unexpected disconnects
- Files: `src/hooks/useRepositories.ts`, any realtime subscribers
- Risk: UI not updated when data changes
- Priority: Low

---

*Concerns audit: 2026-01-28*
