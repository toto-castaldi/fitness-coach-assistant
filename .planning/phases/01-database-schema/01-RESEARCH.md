# Phase 1: Database Schema - Research

**Researched:** 2026-01-28
**Domain:** PostgreSQL schema migration for group exercise flag
**Confidence:** HIGH

## Summary

Phase 1 is a straightforward additive migration. Add `is_group` boolean column to `session_exercises` table with `DEFAULT false` for backward compatibility. No RPC functions in this phase - those come in Phase 4 when needed for batch completion.

**Primary recommendation:** Single migration file adding column + index.

## Standard Stack

No new dependencies. Uses existing Supabase migration pattern.

| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15+ | Database (via Supabase) |
| Supabase CLI | Latest | Migration management |

## Schema Change

### Recommended Migration

```sql
-- Add is_group flag to session_exercises
ALTER TABLE public.session_exercises
  ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering group exercises (partial index for efficiency)
CREATE INDEX session_exercises_is_group_idx
  ON public.session_exercises(is_group)
  WHERE is_group = true;
```

**Why this approach:**
1. `NOT NULL DEFAULT false` - Existing data automatically gets `false`, backward compatible
2. Partial index on `is_group = true` - Only indexes group exercises, smaller + faster
3. No RLS changes needed - Existing policies apply to all columns equally

### Migration File Naming

Following Helix convention in `supabase/migrations/`:
```
YYYYMMDDHHMMSS_add_is_group_to_session_exercises.sql
```

## RLS Policy Verification

The existing RLS policies on `session_exercises` already handle this:

```sql
-- INSERT policy
create policy "Users can insert exercises for their sessions"
  on public.session_exercises for insert
  with check (exists (
    select 1 from public.sessions s
    join public.clients c on c.id = s.client_id
    where s.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));

-- UPDATE policy
create policy "Users can update exercises of their sessions"
  on public.session_exercises for update
  using (exists (
    select 1 from public.sessions s
    join public.clients c on c.id = s.client_id
    where s.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));
```

**Verification:** These policies check session ownership via client, not specific columns. Adding `is_group` column is automatically covered.

## Type Updates Required

After migration, update TypeScript types:

```typescript
// In src/shared/types/index.ts
export interface SessionExercise {
  // ... existing fields
  is_group: boolean;  // NEW
}

export interface SessionExerciseInsert {
  // ... existing fields
  is_group?: boolean;  // NEW (optional, defaults to false)
}
```

## What NOT to Include in Phase 1

Defer to later phases:
- RPC functions (Phase 4 - UI Live Tablet)
- Realtime subscription changes (Phase 4)
- UI components (Phase 3, 4)
- MCP server changes (Phase 2)

Phase 1 is **schema only**.

## Common Pitfalls

### Pitfall 1: Destructive Migration
**What goes wrong:** Using `DROP COLUMN` or restructuring tables
**How to avoid:** Phase 1 is purely additive. Only `ADD COLUMN`.

### Pitfall 2: Missing Default Value
**What goes wrong:** `NOT NULL` without `DEFAULT` fails on existing rows
**How to avoid:** Always include `DEFAULT false` with `NOT NULL`.

### Pitfall 3: Wrong Index Type
**What goes wrong:** Full index on boolean wastes space
**How to avoid:** Use partial index `WHERE is_group = true`.

## Verification Criteria

- [ ] Migration runs without error
- [ ] Existing `session_exercises` rows have `is_group = false`
- [ ] Can insert new row with `is_group = true`
- [ ] Can update `is_group` on existing row
- [ ] RLS blocks updates to other coaches' exercises
- [ ] Index exists and is partial

## Sources

### Primary (HIGH confidence)
- Existing Helix migrations in `supabase/migrations/`
- Project research: `.planning/research/STACK.md`
- Project research: `.planning/research/ARCHITECTURE.md`

### Official Documentation
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)

---
*Phase research extracted from project-level research: 2026-01-28*
