# Architecture

**Analysis Date:** 2026-01-28

## Pattern Overview

**Overall:** Layered client-server architecture with React frontend (Vite), Supabase PostgreSQL backend, and Edge Functions for server-side logic.

**Key Characteristics:**
- Multi-entry React application (main app + live tablet PWA)
- Shared library pattern for common code (hooks, types, UI components)
- Custom hooks for data management (no external state library)
- Supabase SDK for real-time database and auth
- Edge Functions for async processing and integration webhooks
- Row-Level Security (RLS) for data isolation per coach

## Layers

**Presentation (Frontend):**
- Purpose: React UI components, pages, and routing
- Location: `src/` (main app), `src/live/` (tablet app)
- Contains: Pages, components, hooks, utility functions
- Depends on: Supabase client, custom hooks
- Used by: Browser (React Router)

**Shared Code:**
- Purpose: Reusable code used by both main and live apps
- Location: `src/shared/`
- Contains: `hooks/` (useAuth), `lib/` (supabase client, utils), `types/`, `components/ui/`
- Depends on: Supabase SDK, external libraries (shadcn/ui, etc.)
- Used by: Main app and live tablet app

**Data Access (Custom Hooks):**
- Purpose: Manage data fetching, caching, and mutations
- Location: `src/hooks/`
- Examples: `useClients`, `useSessions`, `useExercises`, `useRepositories`
- Pattern: Hooks manage local state, call Supabase, return data + CRUD functions
- Depends on: Supabase client, types

**Backend (Supabase):**
- Purpose: PostgreSQL database, authentication, real-time subscriptions
- Location: `supabase/` (migrations, functions, config)
- Contains: SQL migrations, Edge Functions, RLS policies
- Serves: API for all data operations, OAuth token management

**Edge Functions:**
- Purpose: Server-side business logic and integrations
- Location: `supabase/functions/`
- Examples: `helix-mcp` (MCP server), `docora-webhook` (webhook processing)
- Triggered by: HTTP requests or webhook events
- Access: Supabase client with service role key for privileged operations

## Data Flow

**Authentication Flow:**

1. User enters app → `AuthGuard` component checks session
2. No session → `LoginButton` triggers `signInWithGoogle()` via `useAuth`
3. Supabase OAuth redirects to Google, returns JWT
4. `useAuth` hook stores session in React state
5. All subsequent Supabase calls include JWT in Authorization header

**Entity CRUD Flow (e.g., Clients):**

1. Page (`Clients.tsx`) renders and calls `useClients()`
2. Hook initializes state (empty), sets loading=true
3. `useEffect` calls `fetchClients()` → queries `supabase.from('clients').select()`
4. Supabase applies RLS: filters by user_id
5. Data returned, hook updates state, component re-renders
6. User clicks "Create" → form appears with `ClientForm`
7. Form submits → page calls `createClient(data)` from hook
8. Hook calls `supabase.from('clients').insert()` with user_id + data
9. Supabase RLS validates user ownership, inserts row, returns new client
10. Hook updates local state (optimistic), component re-renders
11. Success → form closes, new client appears in list

**Session Exercise Execution (Live Coaching):**

1. Coach selects date in `TabletDateSelect` → navigates to `TabletLive`
2. `TabletLive` queries sessions for that date via `useSessions`
3. Coach selects client, session loads with exercises
4. Coach marks exercise complete via `ExerciseCard` component
5. Click triggers optimistic update: `setSession()` updates UI immediately
6. Simultaneously calls `updateSessionExercise()` to save to DB
7. If update fails, component shows error (but UI already changed)
8. Coach navigates away → `liveCoachingStorage` persists session to localStorage

**State Management:**

- **Authentication:** Global via `useAuth` hook, checked at app entry
- **Entity data:** Local component state + hook state (clients, sessions, exercises, gyms)
- **Form state:** Local component state (input fields, validation)
- **UI state:** Local component state (modals, loading, errors)
- **Offline data (live coaching):** localStorage via `useLiveCoaching` hook

## Key Abstractions

**Custom Data Hooks:**
- Purpose: Encapsulate Supabase queries and mutations
- Examples: `useClients`, `useSessions`, `useExercises`
- Pattern: Each hook returns object with `{ data, loading, error, create, update, delete, refetch }`
- Location: `src/hooks/`
- Pattern: Use `useCallback` to prevent infinite refetch, `useState` for caching

**UI Component Library:**
- Purpose: Reusable styled components from shadcn/ui
- Location: `src/shared/components/ui/`
- Examples: `Card`, `Button`, `Input`, `Label`, `Switch`
- Built with: Tailwind CSS, radix-ui primitives
- Styling: Tailwind utility classes via `cn()` utility function

**Page Components:**
- Purpose: Route-level components that compose features
- Location: `src/pages/` (main app), `src/live/pages/` (tablet)
- Examples: `Clients.tsx`, `SessionDetail.tsx`, `TabletLive.tsx`
- Pattern: Fetch data via hooks, manage UI state, compose feature components

**Form Components:**
- Purpose: Reusable form UI for entity creation/editing
- Examples: `ClientForm`, `SessionForm`, `ExerciseForm`
- Location: `src/components/{entity}/`
- Pattern: Accept entity data + onSubmit callback, return form JSX

**Type System:**
- Purpose: Share data shapes between frontend and database
- Location: `src/shared/types/index.ts`
- Examples: `Client`, `Session`, `Exercise`, `SessionWithDetails`
- Pattern: Types match database schema + relationships; Insert/Update/WithDetails variants

**Shared Utilities:**
- Purpose: Common functions used across app
- Location: `src/shared/lib/utils.ts`
- Examples: `cn()` (Tailwind merge), `formatDate()`, `calculateAge()`, `stringToHue()`

## Entry Points

**Main App (`/`):**
- Location: `src/main.tsx`
- Entry HTML: `index.html`
- Mounts: `<App />` component
- Router: BrowserRouter with AuthGuard → Layout → pages
- Responsibilities: Desktop coach dashboard (clients, exercises, sessions, gyms, repositories)

**Live Tablet App (`/live`):**
- Location: `src/main-live.tsx`
- Entry HTML: `live.html`
- Mounts: `<AppLive />` component
- Router: BrowserRouter with TabletAuthGuard → live pages
- Responsibilities: Landscape-only tablet UI for live coaching in gym
- Features: Session selection, exercise carousel, real-time parameter tracking

**Shared Entry:**
- Supabase Client: `src/shared/lib/supabase.ts` (single instance, singleton pattern)
- Auth State: `src/shared/hooks/useAuth.ts` (available to both apps)

**Backend Entry:**
- Edge Functions: `supabase/functions/helix-mcp/index.ts` (MCP server)
- Webhooks: `supabase/functions/docora-webhook/index.ts` (Docora repository sync)
- Database: PostgreSQL via `supabase/migrations/`

## Error Handling

**Strategy:** Errors caught at hook level, propagated to component via hook return value or component state

**Patterns:**

- **Hook-level errors:** `useClients()` returns `{ error }` - component checks and displays
- **Form submission errors:** `handleCreate()` catches error, `setError()`, component shows `ErrorAlert`
- **Async errors:** try-catch in event handlers, user shown `toast` or alert
- **Network errors:** Supabase SDK throws, caught by hook, sets error state
- **Auth errors:** `signOut()` called on 401, user redirected to login via AuthGuard
- **Validation errors:** Frontend only (types validate at build time), form inputs have `required` attributes

Example from `src/pages/Clients.tsx`:
```tsx
const onSubmitCreate = async (data: ClientInsert) => {
  await handleCreate(createClient, data)  // handleCreate from useEntityPage
}

// useEntityPage catches and sets error state
if (error) <ErrorAlert message={error} />
```

## Cross-Cutting Concerns

**Logging:** Console only (browser developer tools), no external logging service

**Validation:**
- TypeScript for compile-time type checking
- Supabase RLS policies for runtime data access control
- Form input `required` attributes for basic UI validation

**Authentication:**
- Google OAuth via Supabase Auth (`signInWithGoogle()`)
- JWT in Authorization header for all Supabase requests
- Session stored in Supabase auth context (auto-managed by SDK)
- Two auth methods: API key (CLI/Claude Desktop) and Bearer token (web apps)

**Permissions:**
- Row-Level Security on all tables (filter by user_id)
- Service role key used only in Edge Functions for privileged operations
- Frontend uses anon key with RLS enforcement

**Caching:**
- Browser cache via Workbox (PWA) for static assets and Supabase responses
- `Cache-First` for storage (images, cards) - 30 days
- `NetworkFirst` for API data - 24 hours
- `NetworkOnly` for auth endpoints
- Custom caching for Lumio cards - 7 days

**Real-time:**
- Supabase Realtime subscriptions available (enabled in migration 13)
- Used by live coaching page for multi-coach sync
- Implementation via `supabase.from(table).on('*', callback)`

**Lumio Integration:**
- Docora webhook processes markdown file changes
- Stores cards in `lumio_cards` table
- Images stored in Supabase Storage (bucket: `lumio-images`)
- Cards linked to exercises via `lumio_card_id` foreign key

**MCP Server:**
- Serves Resources (read-only views of coach data)
- Serves Tools (mutations like create_session)
- Serves Prompts (AI planning templates)
- Authentication: API key (CLI) or Bearer token (Claude Web)
- Exposes Helix data to external LLM clients

---

*Architecture analysis: 2026-01-28*
