# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helix - A smartphone-optimized web application that serves as an AI assistant for fitness coaches. The application assists coaches in their gym work as Personal Trainers and Pilates Instructors.

**Production**: https://helix.toto-castaldi.com/

## Logo & Assets

Logo: mano robotica stilizzata con palette Lumio (amber, coral, violet).

- **Source files** (root):
  - `logo/sketch.js` - p5.js sketch sorgente del logo
  - `logo.svg` - logo senza sfondo (per uso nel body della pagina)
  - `logo-circle.svg` - logo con cerchio bianco (per favicon e icone PWA)
- **Assets in `public/`**:
  - `logo.svg` - logo senza sfondo (pagina login, header)
  - `logo-circle.svg` - favicon SVG (usato in index.html)
  - `icon-192.png` - PWA icon 192x192 (con cerchio bianco)
  - `icon-512.png` - PWA icon 512x512 (con cerchio bianco)

## Documentation

- [Product specifications and feature requirements](./docs/SPECS.md)
- [Technical specifications and architecture](./docs/TECH-SPECS.md)
- [Implementation roadmap with step-by-step tasks](./docs/ROADMAP.md)
- [Local development guide](./docs/LOCAL-DEVELOPMENT.md)

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
npm run dev:local     # Avvia tutto (Supabase + Edge Functions + frontend)
```

**IMPORTANTE**: Usa sempre `npm run dev:local` per avviare l'ambiente di sviluppo. Questo comando:
1. Avvia Supabase (se non attivo)
2. Avvia le Edge Functions con le variabili d'ambiente da `supabase/.env` (necessario per Docora)
3. Avvia il frontend Vite

### Comandi Supabase

```bash
npm run supabase:start     # Avvia stack locale
npm run supabase:stop      # Ferma stack locale
npm run supabase:reset     # Reset DB (migrations + seed)
npm run supabase:status    # Stato servizi
npm run supabase:functions # Serve Edge Functions con env file (supabase/.env)
```

### File Ambiente Edge Functions

Le variabili d'ambiente per le Edge Functions (es. Docora) sono in `supabase/.env`:
```
DOCORA_API_URL=https://api.docora.toto-castaldi.com
DOCORA_APP_ID=app_xxx
DOCORA_TOKEN=docora_xxx
DOCORA_AUTH_KEY=xxx
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

Il file `supabase/seed.sql` contiene 15 esercizi default con tag.
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

### Supabase Edge Function Secrets (set via Supabase Dashboard)

| Secret | Description |
|--------|-------------|
| `DOCORA_API_URL` | Docora API URL (e.g., `https://api.docora.toto-castaldi.com`) |
| `DOCORA_APP_ID` | Docora App ID from onboarding |
| `DOCORA_TOKEN` | Docora Bearer token from onboarding |
| `DOCORA_AUTH_KEY` | Client auth key for HMAC webhook verification |

## Database

Schema in `supabase/migrations/`.

Tables:

- `clients` - Coach's clients (first_name, last_name, birth_date, age_years, gender, physical_notes)
- `goal_history` - Client goal history (goal, started_at, ended_at)
- `exercises` - Exercise catalog (user_id null = default, otherwise custom, lumio_card_id for local Lumio cards)
- `exercise_tags` - Exercise categorization tags
- `gyms` - Coach's gyms (name, address, description)
- `sessions` - Training sessions (client_id, gym_id, session_date, status: planned/completed, current_exercise_index)
- `session_exercises` - Exercises in a session (exercise_id, order_index, sets, reps, weight_kg, duration_seconds, completed, completed_at)
- `ai_conversations` - AI chat sessions (user_id, client_id, title)
- `ai_messages` - Messages in AI conversations (conversation_id, role, content)
- `ai_generated_plans` - AI-generated training plans (conversation_id, session_id, plan_json, accepted)
- `coach_ai_settings` - Coach AI configuration (openai_api_key, anthropic_api_key, preferred_provider, preferred_model)

- `lumio_repositories` - Repository GitHub censiti (user_id, github_owner, github_repo, access_token, docora_repository_id, sync_status, last_commit_hash, last_commit_at, last_sync_added, last_sync_updated, last_sync_removed, last_sync_unchanged)
- `lumio_cards` - Carte sincronizzate (repository_id, file_path, title, content, content_hash, frontmatter, source_available)
- `lumio_card_images` - Immagini delle carte (card_id, original_path, storage_path)
- `docora_chunk_buffer` - Buffer temporaneo per file chunked da Docora (chunk_id, repository_id, file_path, chunk_index, chunk_total, content)

**Note Milestone 9:**
- Campo `branch` rimosso da `lumio_repositories` (sempre "main", hardcoded in Edge Function)
- Campo `content_hash` aggiunto a `lumio_cards` per ottimizzazione sync (SHA-256)
- Campi delta (`last_sync_*`) in `lumio_repositories` per tracking modifiche

**Note Milestone 10 - Docora Integration:**
- Campo `docora_repository_id` aggiunto a `lumio_repositories` per mapping con Docora
- Tabella `docora_chunk_buffer` per gestire file > 1MB (chunking da 512KB)

All tables have Row Level Security (RLS) policies.

## Edge Functions

Located in `supabase/functions/`:

| Function | Description |
|----------|-------------|
| `ai-chat` | AI planning chat - receives clientId, generates client card internally, calls OpenAI/Anthropic |
| `client-export` | Generates client card markdown for export (same format used by AI context) |
| `lumio-card` | **DEPRECATED** - External Lumio markdown cards removed, only local cards via Docora |

**Milestone 10 - Docora Integration:**

| Function | Description |
|----------|-------------|
| `docora-webhook` | Riceve webhook da Docora (create/update/delete), processa file .md e immagini |
| `docora-register` | Registra/deregistra repository su Docora (chiamato dal frontend) |
| `lumio-sync-repo` | **DEPRECATED** - Sync manuale, sostituito da Docora webhook automatico |

**Storage Buckets:**

| Bucket | Description |
|--------|-------------|
| `lumio-images` | Immagini carte Lumio sincronizzate |

### Client Card Format

`ai-chat` and `client-export` generate markdown with differenze:
- `client-export`: includes name, gym shows only name + address
- `ai-chat`: excludes name, gym shows name + address + description (for AI context)

```markdown
# Nome Cognome  ← solo in client-export

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
**Dettagli**: Descrizione palestra  ← solo in ai-chat

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

## Docora Integration (Milestone 10)

Docora è un servizio che monitora repository GitHub e invia webhook quando i file cambiano.
Sostituisce il polling diretto di GitHub con sync automatico push-based.

### Architettura

```
┌─────────────────┐     push      ┌─────────────────┐
│  GitHub Repo    │──────────────▶│     Docora      │
└─────────────────┘               └────────┬────────┘
                                           │ webhook
                                           ▼
┌─────────────────┐               ┌─────────────────┐
│  Helix Frontend │◀─────────────▶│  Supabase Edge  │
│  (Repository    │  register/    │  Functions      │
│   management)   │  unregister   │                 │
└─────────────────┘               └─────────────────┘
```

### Flusso

1. **Registrazione**: Quando un coach aggiunge un repository, Helix lo registra su Docora
2. **Monitoraggio**: Docora monitora il repository GitHub per cambiamenti
3. **Webhook**: Su ogni commit, Docora invia webhook a `/docora-webhook/{action}`
4. **Elaborazione**: Edge Function processa i file .md e le immagini
5. **Storage**: Carte salvate in DB, immagini in Supabase Storage

### Webhook Actions

| Action | Descrizione |
|--------|-------------|
| `/create` | Nuovo file aggiunto |
| `/update` | File modificato |
| `/delete` | File rimosso |

### Autenticazione Webhook

- Header `X-Docora-Signature`: HMAC-SHA256 del payload
- Header `X-Docora-Timestamp`: Unix timestamp (max 5 min)
- Header `X-Docora-App-Id`: ID applicazione

### Chunking

File > 1MB vengono inviati in chunk da 512KB:
- Chunk intermedi salvati in `docora_chunk_buffer`
- Ultimo chunk trigger l'assemblaggio e l'elaborazione
- Cleanup automatico dopo 10 minuti

### Migrazione Repository Esistenti

Repository creati prima di Milestone 10 devono essere registrati manualmente:
1. Aprire la pagina Repository
2. Cliccare "Attiva sync automatico" sul repository
3. Il repository verrà registrato su Docora
