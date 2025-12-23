# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness Coach Assistant - A smartphone-optimized web application that serves as an AI assistant for fitness coaches. The application assists coaches in their gym work as Personal Trainers and Pilates Instructors.

**Production**: https://fca.toto-castaldi.com/

## Documentation

- [Product specifications and feature requirements](./docs/SPECS.md)
- [Implementation roadmap with step-by-step tasks](./docs/ROADMAP.md)

## Rules

- **Never execute git commands.** The user handles all git operations (commit, push, pull, etc.) manually.
- **SQL migrations must never cause data loss.** Never use DROP COLUMN, DROP TABLE, or destructive operations without migrating data first. Always preserve existing data with ALTER TABLE ADD COLUMN, data migration scripts, and only then remove old columns if needed.
- **Update CLAUDE.md after migrations.** Always update the Database section in this file when creating new migrations to keep the table list current.

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
2. Database migrations are applied automatically via `supabase db push`
3. Edge Functions are deployed to Supabase

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

- `clients` - Coach's clients (first_name, last_name, birth_date, age_years, physical_notes)
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
