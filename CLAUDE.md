# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness Coach Assistant - A smartphone-optimized web application that serves as an AI assistant for fitness coaches. The application assists coaches in their gym work as Personal Trainers and Pilates Instructors.

**Production**: https://fca.toto-castaldi.com/

## Documentation

- **SPECS.md** - Product specifications and feature requirements
- **ROADMAP.md** - Implementation roadmap with step-by-step tasks

## Rules

- **Never execute git commands.** The user handles all git operations (commit, push, pull, etc.) manually.
- **Never apply Supabase migrations.** The user applies migrations manually. Only create migration files in `supabase/migrations/`.
- **SQL migrations must never cause data loss.** Never use DROP COLUMN, DROP TABLE, or destructive operations without migrating data first. Always preserve existing data with ALTER TABLE ADD COLUMN, data migration scripts, and only then remove old columns if needed.

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

Continuous Delivery via GitHub Actions. On push to `main`, the app is built and deployed to Digital Ocean (Droplet + Nginx + HTTPS).

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Production Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase key |
| `SSH_PRIVATE_KEY` | SSH key for server access |
| `REMOTE_HOST` | Server hostname |
| `REMOTE_USER` | SSH username |
| `DEPLOY_PATH` | Nginx web root |

## Database

Schema in `supabase/migrations/`. Tables:
- `clients` - Coach's clients
- `exercises` - Exercise catalog (default + custom)
- `exercise_blocks` - Step-by-step exercise instructions with images
- `exercise_tags` - Exercise categorization tags
- `goal_history` - Client goal history
- `gyms` - Coach's gyms with address and equipment description

All tables have Row Level Security (RLS) policies.
