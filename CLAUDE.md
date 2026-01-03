# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness Coach Assistant - A smartphone-optimized web application that serves as an AI assistant for fitness coaches. The application assists coaches in their gym work as Personal Trainers and Pilates Instructors.

**Production**: https://fca.toto-castaldi.com/

## Logo & Assets

- **Source**: `logo.svg` (root) - master logo file, all icons generated from this
- **Generated icons** (in `public/`):
  - `logo.svg` - SVG logo for modern browsers
  - `favicon.ico` - 32x32 favicon
  - `icon-192.png` - PWA icon 192x192
  - `icon-512.png` - PWA icon 512x512 (also used as maskable)

## Documentation

- [Product specifications and feature requirements](./docs/SPECS.md)
- [Implementation roadmap with step-by-step tasks](./docs/ROADMAP.md)

## Rules

- **Never execute git commands.** The user handles all git operations (commit, push, pull, etc.) manually.
- **SQL migrations must never cause data loss.** Never use DROP COLUMN, DROP TABLE, or destructive operations without migrating data first. Always preserve existing data with ALTER TABLE ADD COLUMN, data migration scripts, and only then remove old columns if needed.
- **Update CLAUDE.md after migrations.** Always update the Database section in this file when creating new migrations to keep the table list current.
- **Add new Edge Functions to GitHub Action.** When creating a new Edge Function, always add it to `.github/workflows/deploy.yml` in the "Deploy Edge Functions" step.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Google OAuth via Supabase

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Development server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint code
```

## Local Development

Ambiente di sviluppo con Supabase locale (Docker).

### Quick Start

```bash
npm run setup:local   # Setup completo (prerequisiti + supabase start)
npm run dev:local     # Avvia tutto (Supabase + frontend)
```

### Comandi Supabase

```bash
npm run supabase:start     # Avvia stack locale
npm run supabase:stop      # Ferma stack locale
npm run supabase:reset     # Reset DB (migrations + seed)
npm run supabase:status    # Stato servizi
npm run supabase:functions # Serve Edge Functions con hot-reload
```

### URL Locali

| Servizio | URL |
|----------|-----|
| Frontend | `http://localhost:5173` |
| Supabase API | `http://127.0.0.1:54321` |
| Studio (DB GUI) | `http://127.0.0.1:54323` |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

### Google OAuth Locale

Per abilitare login Google in locale, vedi istruzioni in `README.md` sezione "Google OAuth Locale".

### Seed Data

Il file `supabase/seed.sql` contiene 15 esercizi default con tag e blocchi step-by-step.
Viene eseguito automaticamente con `npm run supabase:reset`.

## Project Structure

```
src/
  components/
    auth/           # Authentication components
    ui/             # shadcn/ui components
    Layout.tsx      # Main layout with bottom nav
  pages/            # Route pages
  hooks/            # React hooks (useAuth, etc.)
  lib/
    supabase.ts     # Supabase client
    utils.ts        # Utility functions (cn)
  types/            # TypeScript types
supabase/
  migrations/       # SQL migrations
```

## Environment Setup

Two separate Supabase projects for isolation:

| File | Environment | Usage |
|------|-------------|-------|
| `.env` | Development | `npm run dev` |
| `.env.production` | Production | `npm run build` |

Both files use the same variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase publishable key

## Deployment

Continuous Delivery via GitHub Actions. On push to `main`:
1. Frontend is built and deployed to Digital Ocean (Droplet + Nginx + HTTPS)
2. **Database backup** is created and saved as GitHub Artifact (retention 90 days)
3. Database migrations are applied automatically via `supabase db push`
4. Edge Functions are deployed to Supabase

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Production Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase key |
| `SSH_PRIVATE_KEY` | SSH key for server access |
| `REMOTE_HOST` | Server hostname |
| `REMOTE_USER` | SSH username |
| `DEPLOY_PATH` | Nginx web root |
| `SUPABASE_PROJECT_REF` | Supabase project reference ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token |

## Database

Schema in `supabase/migrations/`.

Tables:

- `clients` - Coach's clients (first_name, last_name, birth_date, age_years, gender, physical_notes)
- `goal_history` - Client goal history (goal, started_at, ended_at)
- `exercises` - Exercise catalog (user_id null = default, otherwise custom)
- `exercise_blocks` - Step-by-step exercise instructions with images
- `exercise_tags` - Exercise categorization tags
- `gyms` - Coach's gyms (name, address, description)
- `sessions` - Training sessions (client_id, gym_id, session_date, status: planned/completed, current_exercise_index)
- `session_exercises` - Exercises in a session (exercise_id, order_index, sets, reps, weight_kg, duration_seconds, completed, completed_at)
- `ai_conversations` - AI chat sessions (user_id, client_id, title)
- `ai_messages` - Messages in AI conversations (conversation_id, role, content)
- `ai_generated_plans` - AI-generated training plans (conversation_id, session_id, plan_json, accepted)
- `coach_ai_settings` - Coach AI configuration (openai_api_key, anthropic_api_key, preferred_provider, preferred_model)

All tables have Row Level Security (RLS) policies.

## Edge Functions

Located in `supabase/functions/`:

| Function | Description |
|----------|-------------|
| `ai-chat` | AI planning chat - receives clientId, generates client card internally, calls OpenAI/Anthropic |
| `client-export` | Generates client card markdown for export (same format used by AI context) |

### Client Card Format

Both `ai-chat` and `client-export` generate markdown with an `includeName` option:
- `client-export`: includes name (for client card export)
- `ai-chat`: excludes name (for AI context privacy)

```markdown
# Nome Cognome  ← solo con includeName=true

## Dati Anagrafici
- **Eta**: X anni
- **Data di nascita**: DD/MM/YYYY
- **Genere**: Maschio/Femmina

## Anamnesi
[Note fisiche del cliente]

## Storia Obiettivi
1. **[ATTUALE]** Obiettivo corrente _(dal DD/MM/YYYY)_
2. Obiettivo precedente _(dal DD/MM/YYYY)_

## Sessioni
### DD/MM/YYYY - Completata
**Palestra**: Nome Palestra
**Indirizzo**: Via Example 123
**Dettagli**: Descrizione palestra

1. ✓ Nome Esercizio - 3 serie, 12 reps, 10 kg
2. X Nome Esercizio Saltato - 2 serie, 10 reps
   - _Note esercizio_

### DD/MM/YYYY - Pianificata
**Palestra**: Nome Palestra
**Indirizzo**: Via Example 123

1. Nome Esercizio - 3 serie, 12 reps, 10 kg
```

## Database Backup & Restore

### Automatic Backups

Every deploy creates a backup before running migrations:
- **Location**: GitHub Actions → Artifacts
- **Naming**: `db-backup-YYYY.MM.DD.HHMM`
- **Retention**: 90 days
- **Contents**: Full SQL dump (schema + data)

### Download Backup

1. Go to GitHub repository → Actions
2. Click on the workflow run for the version you need
3. Scroll to "Artifacts" section
4. Download `db-backup-YYYY.MM.DD.HHMM`

### Restore Database

```bash
# 1. Get the database connection string from Supabase Dashboard
#    Settings → Database → Connection string → URI

# 2. Restore the backup (WARNING: this will overwrite current data)
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f backup-YYYY.MM.DD.HHMM.sql

# Alternative: use Supabase CLI
supabase db reset --linked
psql "$(supabase db url)" -f backup-YYYY.MM.DD.HHMM.sql
```

### Manual Backup

```bash
# Link to production project
supabase link --project-ref <PROJECT_REF>

# Create backup
supabase db dump -f backup-manual-$(date +%Y%m%d-%H%M%S).sql
```
