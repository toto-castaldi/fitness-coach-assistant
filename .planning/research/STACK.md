# Technology Stack: Group Exercise Features

**Project:** Helix - Group Exercise Milestone
**Researched:** 2026-01-28
**Overall Confidence:** HIGH

## Executive Summary

Adding group exercise functionality to Helix requires no new dependencies. The existing stack (React 19, Supabase, TypeScript) fully supports the needed patterns. The key technical decisions involve:

1. **Database pattern:** Boolean `is_group` flag on `session_exercises` + RPC function for batch completion
2. **Realtime sync:** Supabase Postgres Changes for live UI updates
3. **UI pattern:** Tab toggle component with optimistic updates

## Recommended Stack (No Changes Needed)

The existing Helix stack is already optimal for this feature.

### Existing Stack (Retain As-Is)

| Technology | Current Version | Purpose | Why Keep |
|------------|-----------------|---------|----------|
| React 19 | Latest | Frontend framework | Already handles optimistic updates in useLiveCoaching |
| TypeScript | 5.x | Type safety | Existing types extend easily for `is_group` |
| Supabase | Latest | Backend | Native batch updates via `.in()`, RPC for transactions |
| Tailwind CSS | 3.x | Styling | Tab toggle components trivial to build |
| shadcn/ui | Latest | UI components | Has Tabs component ready to use |

### Database Layer (Supabase PostgreSQL)

| Pattern | Implementation | Why |
|---------|----------------|-----|
| Flag field | `is_group BOOLEAN DEFAULT false` on session_exercises | Simplest approach; no new tables, no joins |
| Batch completion | PostgreSQL RPC function | Single query updates all matching exercise IDs |
| Realtime sync | Postgres Changes subscription | Already enabled for `session_exercises` table |

**Key rationale:** The existing `session_exercises` table already tracks individual exercise instances per session. Adding `is_group` allows filtering without schema complexity.

## Database Design Pattern

### Option Considered: Junction Table vs Flag

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| `is_group` boolean flag | Simple, no migrations, no new RLS policies | Denormalized | **RECOMMENDED** |
| `group_exercises` junction table | Normalized, explicit grouping | Extra table, complex queries, migration risk | Rejected |
| Separate `group_session_exercises` table | Clean separation | Duplicates structure, harder to query across | Rejected |

**Decision:** Use `is_group` boolean because:
1. Helix already uses per-client sessions (one session per client)
2. Group exercises are still per-client; they just share the same exercise definition
3. Completing "group" means updating multiple `session_exercises` rows with same `exercise_id` and date

### Recommended Schema Migration

```sql
-- Add is_group flag to session_exercises
ALTER TABLE public.session_exercises
  ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX session_exercises_is_group_idx
  ON public.session_exercises(is_group);
```

**Confidence:** HIGH - This is a non-destructive additive migration following project rules.

### Recommended RPC Function for Batch Completion

```sql
CREATE OR REPLACE FUNCTION complete_group_exercises(
  p_exercise_id uuid,
  p_session_date date,
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Update all group exercises matching the criteria
  UPDATE session_exercises se
  SET
    completed = true,
    skipped = false,
    completed_at = now()
  FROM sessions s
  JOIN clients c ON c.id = s.client_id
  WHERE se.session_id = s.id
    AND se.exercise_id = p_exercise_id
    AND se.is_group = true
    AND s.session_date = p_session_date
    AND c.user_id = p_user_id;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Confidence:** HIGH - RPC pattern verified in Supabase documentation.

## Frontend Patterns

### Tab Toggle Pattern

Use shadcn/ui Tabs component for "Individuali" | "Gruppo" toggle.

```typescript
// Recommended component structure
interface GroupExerciseTabsProps {
  mode: 'individual' | 'group'
  onModeChange: (mode: 'individual' | 'group') => void
}
```

**Pattern rationale:** The existing `ExerciseCarousel` shows exercises for one client. The group view shows a different data slice (all group exercises for the day) using the same card component.

### Data Flow Pattern

```
TabletLive
  |
  +-- mode: 'individual' | 'group'
  |
  +-- individual mode
  |     |-- sessions[] (existing)
  |     +-- ExerciseCarousel (existing)
  |
  +-- group mode
        |-- groupExercises[] (new query)
        +-- GroupExerciseList (new component)
              |-- ExerciseCard (existing, reused)
              +-- complete -> calls RPC
```

### Optimistic Update Pattern (Reuse Existing)

The existing `useLiveCoaching` hook pattern should be extended:

```typescript
// Existing pattern (keep)
const completeExercise = async (sessionId, exerciseId) => {
  // 1. Optimistic update local state
  setSessions(prev => /* update */)

  // 2. DB update
  await supabase.from('session_exercises').update(...)
}

// New pattern for group (add)
const completeGroupExercise = async (exerciseId, date) => {
  // 1. Optimistic update ALL sessions with this exercise
  setSessions(prev => prev.map(session => ({
    ...session,
    exercises: session.exercises?.map(ex =>
      ex.exercise_id === exerciseId && ex.is_group
        ? { ...ex, completed: true, completed_at: new Date().toISOString() }
        : ex
    )
  })))

  // 2. Single RPC call
  await supabase.rpc('complete_group_exercises', {
    p_exercise_id: exerciseId,
    p_session_date: date,
    p_user_id: userId
  })
}
```

**Confidence:** HIGH - Follows existing codebase patterns in `/home/toto/scm-projects/helix/src/shared/hooks/useLiveCoaching.ts`.

## Realtime Sync Considerations

### Current State

Realtime is already enabled for the tables (migration `00000000000013_enable_realtime.sql`).

### Group Exercise Sync

When one coach completes a group exercise, other connected clients need updates. However, Helix is single-user (one coach), so multi-client sync is not needed initially.

**If multi-coach support added later:**

```typescript
// Subscribe to group exercise completions
supabase
  .channel('group-exercises')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'session_exercises',
    filter: 'is_group=eq.true'
  }, (payload) => {
    // Update local state
  })
  .subscribe()
```

**Performance note:** Supabase Postgres Changes processes on a single thread. For 100 users subscribed with one update, it triggers 100 RLS checks. Not a concern for single-user app.

**Confidence:** MEDIUM - Realtime pattern verified but multi-user not currently needed.

## Query Patterns

### Fetch Group Exercises for Date

```typescript
const fetchGroupExercises = async (date: string) => {
  const { data } = await supabase
    .from('session_exercises')
    .select(`
      *,
      exercise:exercises(*),
      session:sessions!inner(
        id,
        session_date,
        client:clients(id, first_name, last_name)
      )
    `)
    .eq('is_group', true)
    .eq('session.session_date', date)
    .order('exercise_id')
}
```

**Pattern:** This query returns all group exercises for a date, grouped by exercise. The UI aggregates by `exercise_id` to show each group exercise once with participant count.

### Batch Update via .in() Filter

For simpler cases without RPC:

```typescript
// Complete multiple session_exercises by ID
const { error } = await supabase
  .from('session_exercises')
  .update({
    completed: true,
    skipped: false,
    completed_at: new Date().toISOString()
  })
  .in('id', exerciseIds)
```

**Confidence:** HIGH - Verified in Supabase JavaScript documentation.

## UI Component Recommendations

### Tab Toggle (shadcn/ui Tabs)

```typescript
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

<Tabs value={mode} onValueChange={onModeChange}>
  <TabsList>
    <TabsTrigger value="individual">Individuali</TabsTrigger>
    <TabsTrigger value="group">Gruppo</TabsTrigger>
  </TabsList>
</Tabs>
```

### Group Exercise Card Layout

Reuse existing `ExerciseCard` component with additional participant badges:

```typescript
// Show participant avatars on group exercise card
<ExerciseCard exercise={exercise}>
  <div className="flex -space-x-2">
    {participants.map(client => (
      <ClientAvatar key={client.id} client={client} size="sm" />
    ))}
  </div>
</ExerciseCard>
```

## Alternatives Considered

### Alternative 1: Event Sourcing Pattern

**What:** Store group completions as events, rebuild state.
**Why rejected:** Overkill for this use case. Simple flag + batch update is sufficient.

### Alternative 2: Separate Group Sessions Table

**What:** New `group_sessions` table linking multiple `sessions`.
**Why rejected:** Helix's model is one session per client. Group exercises are a filter on existing data, not a new entity type.

### Alternative 3: Real-time Broadcast Instead of Postgres Changes

**What:** Use Supabase Broadcast for faster updates.
**Why rejected:** Single-user app doesn't need the performance. Postgres Changes provides data integrity.

## Installation

No new packages required. Existing dependencies cover all needs:

```bash
# No changes needed - existing packages sufficient:
# - @supabase/supabase-js (already installed)
# - shadcn/ui tabs (already available)
# - React 19 (already installed)
```

## Migration Checklist

1. [ ] Add `is_group` column to `session_exercises`
2. [ ] Create `complete_group_exercises` RPC function
3. [ ] Update types in `/src/shared/types/index.ts`
4. [ ] Extend `useLiveCoaching` hook with group functions
5. [ ] Add Tab toggle to `TabletLive.tsx`
6. [ ] Create `GroupExerciseList` component
7. [ ] Update MCP server resources (if needed)

## Sources

### Official Documentation (HIGH confidence)
- [Supabase Update Documentation](https://supabase.com/docs/reference/javascript/update) - Batch update with .in() filter
- [Supabase RPC Documentation](https://supabase.com/docs/reference/javascript/rpc) - Array parameters in RPC calls
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Performance considerations, filter syntax

### Architecture References (MEDIUM confidence)
- [PostgreSQL Batch Update Patterns](https://www.geeksforgeeks.org/postgresql/how-to-update-multiple-rows-in-postgresql/) - CASE..WHEN and array updates
- [Fitness App Database Patterns](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application) - Many-to-many relationship patterns

### Industry Research (MEDIUM confidence)
- [Group Fitness App Trends](https://www.fitbudd.com/post/best-app-for-fitness-challenges-guide) - Shared workout patterns
- [Hevy Coach](https://hevycoach.com/) - Shared exercise library pattern
- [My PT Hub](https://www.mypthub.net/) - Group session management
