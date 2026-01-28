# Codebase Structure

**Analysis Date:** 2026-01-28

## Directory Layout

```
helix/
├── src/                           # Main frontend source code
│   ├── App.tsx                    # Main app router & auth
│   ├── AppLive.tsx                # Live tablet app router & auth
│   ├── main.tsx                   # Main app entry point
│   ├── main-live.tsx              # Live tablet app entry point
│   ├── index.css                  # Global styles (Tailwind)
│   │
│   ├── shared/                    # Shared code (main + live apps)
│   │   ├── types/
│   │   │   └── index.ts           # All TypeScript types (Client, Session, Exercise, etc.)
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Supabase client singleton
│   │   │   ├── utils.ts           # Utility functions (cn, formatDate, calculateAge, etc.)
│   │   │   └── liveCoachingStorage.ts  # localStorage persistence
│   │   ├── hooks/
│   │   │   └── useAuth.ts         # Authentication state & sign in/out
│   │   └── components/
│   │       └── ui/                # shadcn/ui components (button, card, input, etc.)
│   │
│   ├── components/                # Main app feature components
│   │   ├── Layout.tsx             # Main app header + bottom nav + outlet
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx      # Protects routes, shows login if no session
│   │   │   └── LoginButton.tsx    # Google OAuth sign in button
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx     # Display single client in list
│   │   │   ├── ClientForm.tsx     # Create/edit client form
│   │   │   ├── GoalForm.tsx       # Add/edit goal modal
│   │   │   └── GoalList.tsx       # Display client goal history
│   │   ├── exercises/
│   │   │   ├── ExerciseCard.tsx   # Display single exercise
│   │   │   ├── ExerciseForm.tsx   # Create/edit exercise form
│   │   │   └── ExerciseTagsInput.tsx  # Multi-tag selector
│   │   ├── gyms/
│   │   │   ├── GymCard.tsx        # Display single gym
│   │   │   └── GymForm.tsx        # Create/edit gym form
│   │   ├── sessions/
│   │   │   ├── SessionCard.tsx    # Display single session in list
│   │   │   ├── SessionForm.tsx    # Create/edit session form
│   │   │   ├── SessionExerciseCard.tsx  # Exercise within session
│   │   │   └── ExercisePicker.tsx # Dialog to add exercise to session
│   │   ├── repositories/
│   │   │   ├── RepositoryCard.tsx # Display GitHub repository
│   │   │   ├── RepositoryForm.tsx # Add new repository form
│   │   │   └── SyncStatusBadge.tsx  # Show repo sync status
│   │   ├── lumio/
│   │   │   ├── LumioCardModal.tsx # Display Lumio card content
│   │   │   └── LumioCardImage.tsx # Image from Lumio card
│   │   ├── shared/
│   │   │   ├── PageHeader.tsx     # Page title + add button
│   │   │   ├── FormCard.tsx       # Card wrapper for forms
│   │   │   ├── DeleteConfirmDialog.tsx  # Delete confirmation modal
│   │   │   ├── ErrorAlert.tsx     # Error message display
│   │   │   ├── EmptyState.tsx     # Empty state message
│   │   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   │   ├── CardActions.tsx    # Edit/delete buttons for cards
│   │   │   └── FormActions.tsx    # Submit/cancel buttons for forms
│   │   ├── pwa/
│   │   │   ├── InstallPrompt.tsx  # PWA install banner
│   │   │   ├── PWAUpdatePrompt.tsx  # New version available prompt
│   │   │   └── OfflineIndicator.tsx  # Shows when offline
│   │   ├── markdown/
│   │   │   └── MarkdownRenderer.tsx  # Render markdown content safely
│   │   └── ui/
│   │       └── Heading.tsx        # (stub)
│   │
│   ├── hooks/                     # Main app custom hooks
│   │   ├── useAuth.ts             # Re-export from shared (backward compat)
│   │   ├── useClients.ts          # Fetch/create/update/delete clients
│   │   ├── useGoals.ts            # Fetch/create goals
│   │   ├── useGyms.ts             # Fetch/create/update/delete gyms
│   │   ├── useExercises.ts        # Fetch/create/update/delete exercises + tags
│   │   ├── useSessions.ts         # Fetch/create/update/delete sessions + exercises
│   │   ├── useLumioCards.ts       # Fetch Lumio cards from repositories
│   │   ├── useRepositories.ts     # Manage GitHub repositories, sync status
│   │   ├── useFilteredExercises.ts  # Filter exercises by tag
│   │   ├── useAISettings.ts       # Fetch/update AI provider settings
│   │   ├── useLiveCoaching.ts     # Re-export from shared
│   │   └── useEntityPage.ts       # Generic CRUD page state (show/edit/delete forms)
│   │
│   ├── lib/                       # Main app utilities
│   │   ├── supabase.ts            # Re-export from shared
│   │   ├── utils.ts               # Re-export from shared
│   │   ├── liveCoachingStorage.ts # Re-export from shared
│   │   ├── github.ts              # GitHub API helpers
│   │   ├── lumio.ts               # Lumio card parsing (frontmatter, markdown)
│   │   └── lumio-images.ts        # Image path mapping for Lumio cards
│   │
│   ├── types/                     # Main app types
│   │   └── index.ts               # Re-export from shared (backward compat)
│   │
│   ├── pages/                     # Main app route pages
│   │   ├── Clients.tsx            # List clients with CRUD
│   │   ├── ClientDetail.tsx       # View/edit client, manage goals & sessions
│   │   ├── Exercises.tsx          # List exercises with CRUD
│   │   ├── ExerciseDetail.tsx     # View/edit exercise, show Lumio card + tags
│   │   ├── Gyms.tsx               # List gyms with CRUD
│   │   ├── Sessions.tsx           # List sessions with filtering
│   │   ├── SessionDetail.tsx      # View/edit session, manage exercises
│   │   ├── LiveCoaching.tsx       # Link to live tablet app
│   │   ├── Repositories.tsx       # Manage GitHub repositories + sync status
│   │   ├── Settings.tsx           # AI settings, MCP API key generation
│   │   └── OAuthConsent.tsx       # OAuth 2.1 consent page for Claude Web
│   │
│   ├── live/                      # Live tablet app
│   │   ├── pages/
│   │   │   ├── TabletLogin.tsx    # Simplified login for tablet
│   │   │   ├── TabletDateSelect.tsx  # Select date and client for live session
│   │   │   └── TabletLive.tsx     # Main live coaching interface (carousel + controls)
│   │   └── components/
│   │       ├── ClientStripBar.tsx     # Header showing client name
│   │       ├── ClientAvatar.tsx       # Circular avatar with initials
│   │       ├── ActionPanel.tsx        # Left panel with controls
│   │       ├── ExerciseCarousel.tsx   # Center carousel of exercises
│   │       ├── ExerciseCard.tsx       # Single exercise with params
│   │       ├── ParameterControl.tsx   # Input controls (sets, reps, weight, etc.)
│   │       ├── ExercisePickerLive.tsx # Dialog to add exercise to live session
│   │       ├── LumioCardModalLive.tsx # Display Lumio card on tablet
│   │       ├── ConfirmDialog.tsx      # Generic confirmation modal
│   │       └── SaveIndicator.tsx      # Shows "Saving..." status
│   │
├── supabase/                      # Backend (Supabase & Edge Functions)
│   ├── config.toml                # Supabase CLI config
│   ├── migrations/                # Database schema migrations (SQL)
│   │   ├── 00000000000000_initial_schema.sql     # Tables: clients, goals, exercises, sessions, etc.
│   │   ├── 00000000000001_live_coaching.sql      # Add current_exercise_index
│   │   ├── 00000000000002_add_skipped.sql        # Add skipped to session_exercises
│   │   ├── 00000000000006_lumio_repositories.sql # Lumio repo tracking
│   │   ├── 00000000000007_lumio_cards.sql        # Synced Lumio cards
│   │   ├── 00000000000008_lumio_card_images.sql  # Lumio card images
│   │   ├── 00000000000012_docora_integration.sql # Docora repo sync + chunk buffer
│   │   ├── 00000000000013_enable_realtime.sql    # Enable Realtime on tables
│   │   └── 00000000000016_mcp_api_key.sql        # MCP API key hash storage
│   │
│   ├── functions/                 # Edge Functions (server-side code)
│   │   ├── helix-mcp/
│   │   │   └── index.ts           # MCP server: resources, tools, prompts
│   │   ├── docora-webhook/
│   │   │   └── index.ts           # Process Docora repository sync webhooks
│   │   ├── docora-register/
│   │   │   └── index.ts           # Register/unregister repo on Docora
│   │   ├── client-export/
│   │   │   └── index.ts           # Generate client card markdown
│   │   ├── lumio-sync-repo/ (DEPRECATED)
│   │   │   └── index.ts           # Manual sync (replaced by Docora webhook)
│   │   ├── ai-chat/ (DEPRECATED)
│   │   │   └── index.ts           # AI planning (replaced by helix-mcp)
│   │   ├── lumio-card/ (DEPRECATED)
│   │   │   └── index.ts           # External Lumio cards (removed)
│   │   └── _shared/
│   │       ├── client-card.ts     # Shared client card generation logic
│   │       ├── auth.ts            # Shared auth helpers
│   │       └── database.ts        # Shared database helpers
│   │
│   └── .env                       # Edge Function env vars (Docora API key, etc.)
│
├── public/                        # Static assets (main app)
│   ├── logo.svg                   # Logo SVG (header)
│   ├── logo-circle.svg            # Logo with circle (favicon)
│   ├── icon-192.png               # PWA icon 192x192
│   ├── icon-512.png               # PWA icon 512x512
│   └── favicon.ico                # Favicon
│
├── public-live/                   # Static assets (live tablet app)
│   ├── logo.svg
│   └── icon-192.png
│
├── index.html                     # Main app HTML entry
├── live.html                      # Live tablet app HTML entry
├── vite.config.ts                 # Main app Vite config
├── vite.config.live.ts            # Live tablet app Vite config
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # App TypeScript config
├── tsconfig.node.json             # Node/build TypeScript config
├── package.json                   # Dependencies & scripts
├── eslint.config.js               # ESLint config
├── components.json                # shadcn/ui config
│
├── docs/                          # Documentation
│   ├── SPECS.md                   # Product specifications
│   ├── TECH-SPECS.md              # Technical specifications
│   ├── ROADMAP.md                 # Implementation roadmap
│   └── LOCAL-DEVELOPMENT.md       # Local dev guide
│
├── .github/
│   └── workflows/
│       ├── deploy.yml             # CI/CD: build, deploy frontend, run migrations, deploy functions
│       └── lint.yml               # Linting check
│
├── CLAUDE.md                      # Instructions for Claude (this file)
└── README.md                      # Project overview
```

## Directory Purposes

**`src/`** - All frontend source code
- Contains both main and live apps plus shared code
- Tree-shaken during build to separate `dist/` and `dist-live/`

**`src/shared/`** - Code used by both main and live apps
- `types/`: TypeScript type definitions that match database schema
- `lib/`: Utilities, Supabase client, storage helpers
- `hooks/`: Auth state (useAuth) - other hooks are app-specific in `src/hooks/`
- `components/ui/`: shadcn/ui base components

**`src/components/`** - Main app feature components
- Organized by domain: clients, exercises, gyms, sessions, repositories, lumio
- Shared components (ErrorAlert, FormCard, etc.) in `shared/` subdirectory
- Each domain folder contains related feature components

**`src/hooks/`** - Main app custom hooks
- Data fetching hooks: `useClients`, `useExercises`, `useSessions`, `useGyms`
- Domain hooks: `useGoals`, `useLumioCards`, `useRepositories`, `useAISettings`
- Utility hooks: `useEntityPage` (generic form state), `useFilteredExercises`

**`src/lib/`** - Main app utilities
- Most content re-exported from `src/shared/lib/` for backward compatibility
- New utilities: `github.ts` (GitHub API), `lumio.ts` (card parsing), `lumio-images.ts` (image mapping)

**`src/pages/`** - Route-level page components
- One component per route (10+ files)
- Each page imports hooks and composes features
- Examples: `Clients.tsx`, `SessionDetail.tsx`, `ExerciseDetail.tsx`

**`src/live/`** - Isolated live tablet app
- Complete separate routing and pages (date select, live coaching)
- Components specific to tablet (carousel, action panel, parameter controls)
- Different layout: landscape-only, touch-optimized, simple navigation

**`supabase/migrations/`** - Database schema
- Sequential SQL files (numbered 00000000000000+)
- Each migration is atomic (single feature or bug fix)
- Never destructive (no DROP COLUMN without migration)
- Applied automatically on deploy via CI/CD

**`supabase/functions/`** - Edge Functions
- `helix-mcp`: Main MCP server for external LLM integration
- `docora-*`: Docora repository sync integration
- `client-export`: Generate markdown cards for export
- `_shared/`: Shared code imported by functions

**`public/` and `public-live/`** - Static assets
- SVG logos, PNG icons, favicon
- Icons for PWA (192x512 for manifest)
- Separate directories for each app entry

## Key File Locations

**Entry Points:**

| File | Purpose | App |
|------|---------|-----|
| `src/main.tsx` | Renders `<App />` | Main |
| `src/main-live.tsx` | Renders `<AppLive />` | Live Tablet |
| `index.html` | HTML for main app | Main |
| `live.html` | HTML for live tablet app | Live Tablet |
| `supabase/functions/helix-mcp/index.ts` | MCP server handler | Backend |

**Configuration:**

| File | Purpose |
|------|---------|
| `vite.config.ts` | Main app build config |
| `vite.config.live.ts` | Live app build config |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencies and scripts |
| `supabase/config.toml` | Supabase CLI config |
| `.env` | Development env vars |
| `.env.production` | Production env vars |

**Core Logic:**

| File | Purpose |
|------|---------|
| `src/shared/lib/supabase.ts` | Supabase client singleton |
| `src/shared/hooks/useAuth.ts` | Authentication state |
| `src/hooks/useClients.ts` | Client data CRUD |
| `src/hooks/useSessions.ts` | Session data CRUD |
| `src/hooks/useExercises.ts` | Exercise data CRUD |
| `src/hooks/useRepositories.ts` | Repository management |
| `src/shared/types/index.ts` | All TypeScript types |

**Testing:**

| Location | Purpose |
|----------|---------|
| None currently | No test files in repository |

## Naming Conventions

**Files:**

- **React Components:** PascalCase.tsx (e.g., `ClientForm.tsx`, `ExerciseCard.tsx`)
- **Utilities:** camelCase.ts (e.g., `liveCoachingStorage.ts`, `lumio-images.ts`)
- **Pages:** PascalCase.tsx matching route (e.g., `Clients.tsx`, `SessionDetail.tsx`)
- **Hooks:** camelCase starting with `use` (e.g., `useClients.ts`, `useExercises.ts`)
- **Types:** PascalCase in `types/index.ts` (e.g., `Client`, `Session`, `Exercise`)
- **Migrations:** `XXXXXXXXXXXXXXX_description.sql` (numbered, snake_case description)
- **Edge Functions:** kebab-case directory (e.g., `docora-webhook`, `helix-mcp`)

**Directories:**

- **Feature domains:** lowercase (e.g., `clients/`, `exercises/`, `sessions/`)
- **Shared utilities:** lowercase (e.g., `lib/`, `hooks/`, `types/`, `components/`)
- **App-specific:** descriptive (e.g., `live/`, `pages/`, `public/`)

**Variables & Functions:**

- **Constants:** UPPERCASE_SNAKE_CASE (e.g., `APP_VERSION`, `corsHeaders`)
- **Functions:** camelCase (e.g., `formatDate()`, `calculateAge()`, `hashApiKey()`)
- **React state:** camelCase (e.g., `isLoading`, `showForm`, `editingItem`)
- **Types/Interfaces:** PascalCase (e.g., `Client`, `SessionWithDetails`)

## Where to Add New Code

**New Feature (e.g., Workout History):**

1. **Types:** Add to `src/shared/types/index.ts` (e.g., `WorkoutHistory` interface)
2. **Migrations:** Create `supabase/migrations/XXXXX_workout_history.sql` (schema)
3. **Hook:** Create `src/hooks/useWorkoutHistory.ts` (CRUD operations)
4. **Components:** Create `src/components/workoutHistory/` with feature components
5. **Page:** Create `src/pages/WorkoutHistory.tsx` (route component)
6. **Router:** Add route to `src/App.tsx`

**New Shared Component:**

1. If UI primitive: Add to `src/shared/components/ui/`
2. If feature: Add to `src/components/shared/` (e.g., `ErrorAlert.tsx`)
3. Export from `src/components/shared/index.ts` for convenience

**New Utility Function:**

1. If shared: Add to `src/shared/lib/utils.ts`
2. If app-specific: Add to `src/lib/` or create domain-specific file

**New Edge Function:**

1. Create directory: `supabase/functions/{function-name}/`
2. Create `index.ts` with handler function
3. Add to `.github/workflows/deploy.yml` deploy step
4. Share common code via `supabase/functions/_shared/`

**New Live Tablet Component:**

1. Create in `src/live/components/`
2. Import shared components from `src/shared/components/`
3. Follow mobile-first responsive design (landscape orientation assumed)

## Special Directories

**`supabase/functions/_shared/`:**
- Purpose: Shared code imported by Edge Functions
- Generated: No
- Committed: Yes
- Files: `client-card.ts` (card generation), `auth.ts`, `database.ts`

**`dist/` and `dist-live/`:**
- Purpose: Production builds
- Generated: Yes (via `npm run build` and `npm run build:live`)
- Committed: No
- Created: During CI/CD, deployed to Digital Ocean

**`.claude/`:**
- Purpose: Claude AI context for code assistance
- Generated: Yes (by Claude)
- Committed: No (or selective)
- Contains: Context snapshots for long conversations

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No
- Lockfile: `pnpm-lock.yaml` (committed)

---

*Structure analysis: 2026-01-28*
