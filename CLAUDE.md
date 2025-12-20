# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness Coach Assistant - A smartphone-optimized web application that serves as an AI assistant for fitness coaches. The application assists coaches in their gym work as Personal Trainers and Pilates Instructors.

**Production**: https://fca.toto-castaldi.com/

## Rules

- **Never execute git commands.** The user handles all git operations (commit, push, pull, etc.) manually.

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

Schema in `supabase/migrations/001_initial_schema.sql`. Tables:
- `clients` - Coach's clients
- `exercises` - Exercise catalog (default + custom)
- `training_sessions` - Training sessions
- `session_exercises` - Exercises performed in session
- `goal_history` - Client goal history
- `ai_generated_plans` - AI-generated workout plans

All tables have Row Level Security (RLS) policies.
