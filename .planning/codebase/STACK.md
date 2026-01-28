# Technology Stack

**Analysis Date:** 2026-01-28

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase for frontend and Edge Functions
- HTML5 - Index and markup for main app and live tablet app
- CSS - Styling via Tailwind CSS

**Secondary:**
- SQL - Database migrations and Supabase queries
- YAML - GitHub Actions workflows and Supabase config
- JavaScript - Package scripts and configuration

## Runtime

**Environment:**
- Node.js 20+ (specified in GitHub Actions deployment; local: 22.20.0)
- Deno - Edge Function runtime (Supabase Edge Functions)

**Package Manager:**
- npm 11.6.2
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.0 - UI framework for main app and live tablet app
- React Router DOM 7.11.0 - Client-side routing
- Vite 7.2.4 - Build tool and dev server

**UI & Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- shadcn/ui - Component library (via @radix-ui packages)
- Lucide React 0.562.0 - Icon library
- class-variance-authority 0.7.1 - Component variant system
- tailwind-merge 3.4.0 - Merge Tailwind classes

**Content Processing:**
- react-markdown 10.1.0 - Markdown rendering
- remark-gfm 4.0.1 - GitHub-flavored Markdown support
- remark-math 6.0.0 - Math notation parsing
- rehype-katex 7.0.1 - KaTeX math rendering
- gray-matter 4.0.3 - YAML frontmatter parsing
- KaTeX 0.16.27 - LaTeX math typesetting

**Forms & Validation:**
- React Hook Form 7.69.0 - Form state management
- @hookform/resolvers 5.2.2 - Schema validation integration
- Zod 4.2.1 - TypeScript-first schema validation

**Utilities:**
- sonner 2.0.7 - Toast notifications
- clsx 2.1.1 - Conditional classname utility

**PWA & Offline:**
- vite-plugin-pwa 1.2.0 - PWA manifest and workbox integration
- workbox-window 7.4.0 - Service worker client library

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.89.0 - Supabase client (Auth, Database, Storage, Realtime)
  - Provides: PostgreSQL database access, Google OAuth, real-time subscriptions, file storage
  - Edge Function versions: jsr:@supabase/supabase-js@2 (Deno runtime)

**Infrastructure:**
- supabase (CLI) 2.70.5 - Supabase project management and local development
- @vitejs/plugin-react 5.1.1 - React Fast Refresh for Vite
- @tailwindcss/vite 4.1.18 - Tailwind CSS Vite integration

**Development:**
- eslint 9.39.1 - Code linting
- @eslint/js 9.39.1 - JavaScript linting rules
- typescript-eslint 8.46.4 - TypeScript linting
- eslint-plugin-react-hooks 7.0.1 - React Hooks rules
- eslint-plugin-react-refresh 0.4.24 - React Fast Refresh rules
- globals 16.5.0 - Global variable definitions
- @types/react 19.2.5, @types/react-dom 19.2.3 - React type definitions
- @types/node 24.10.4 - Node.js type definitions
- @types/katex 0.16.7 - KaTeX type definitions

## Configuration

**Environment:**
- `.env` - Development environment (remote Supabase)
- `.env.local` - Local development (local Supabase via Docker)
- `.env.production` - Production build environment
- Configuration via `VITE_` prefix for frontend, `Deno.env.get()` for Edge Functions

**Key Variables:**
- `VITE_SUPABASE_URL` - Supabase project API endpoint
- `VITE_SUPABASE_ANON_KEY` - Public authentication key
- `VITE_APP_VERSION` - Version string (set during CI/CD)
- `GOOGLE_CLIENT_ID` - OAuth client ID (local only)
- `GOOGLE_CLIENT_SECRET` - OAuth client secret (local only)
- `DOCORA_API_URL` - Docora webhook service endpoint
- `DOCORA_APP_ID`, `DOCORA_TOKEN`, `DOCORA_AUTH_KEY` - Docora credentials

**Build:**
- `vite.config.ts` - Main app (frontend + dashboard)
- `vite.config.live.ts` - Tablet live coaching app (landscape-only)
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` → `./src/*`)
- `eslint.config.js` - ESLint configuration (flat config format)
- `tsconfig.app.json` - App-specific TypeScript settings (ES2022 target, strict mode)
- `tsconfig.node.json` - Build tool TypeScript settings

**Supabase Local:**
- `supabase/config.toml` - Local development configuration
  - Database: PostgreSQL 15, ports 54321-54326
  - Storage: `lumio-images` bucket (public, 10MiB limit)
  - Auth: Google OAuth, JWT expiry 3600s
  - Edge Functions: Deno runtime, individual JWT settings per function

## Platform Requirements

**Development:**
- Node.js 20+ (npm 11+)
- Docker (for Supabase local stack)
- PostgreSQL 15 (managed by Supabase Docker)
- Git

**Production:**
- Node.js 20+ runtime (for build)
- Static hosting (HTTPS required)
- Supabase project (PostgreSQL, Storage, Auth)
- Digital Ocean Droplet (current deployment target)
- Nginx (reverse proxy and HTTPS)

## Build & Output

**Main App:**
- Input: `src/` (excludes `src/live/`)
- Entry: `index.html` + `src/main.tsx`
- Output: `dist/` (deployed to production web root)

**Live Tablet App:**
- Input: `src/live/` + shared `src/shared/`
- Entry: `live.html` + `src/live/main.tsx`
- Output: `dist-live/` (deployed to separate domain `live.helix.toto-castaldi.com`)

**Edge Functions:**
- Runtime: Deno with TypeScript
- Location: `supabase/functions/{function-name}/index.ts`
- Deployed: Supabase Edge Functions (automatic on CI/CD)
- Imports: JSR modules (jsr: prefix) and https:// URLs

---

*Stack analysis: 2026-01-28*
