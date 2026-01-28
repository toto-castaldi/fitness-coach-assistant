# Architecture Patterns: Group Exercise Completion

**Domain:** Group exercise completion in fitness coaching app
**Researched:** 2026-01-28
**Confidence:** HIGH

## Problem Statement

When a coach marks a group exercise as "done," the system must update multiple `session_exercises` rows atomically:
- Find all `session_exercises` for the same date + same `exercise_id` + `is_group=true`
- Mark all as `completed=true` with `completed_at` timestamp
- Propagate changes in real-time to all subscribed tablet clients
- Respect RLS (coach can only update their own clients' sessions)

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Tablet UI (TabletLive.tsx)                       │
│                                                                          │
│  ┌──────────────────┐        ┌────────────────────────────────────────┐ │
│  │ ClientStripBar   │        │         ExerciseCarousel               │ │
│  │ (multi-client)   │        │  [group badge on grouped exercises]    │ │
│  └──────────────────┘        └────────────────────────────────────────┘ │
│           │                              │                               │
│           └──────────────┬───────────────┘                               │
│                          ▼                                               │
│               ┌─────────────────────┐                                    │
│               │  useLiveCoaching    │ ◄── completeGroupExercise()       │
│               │      (hook)         │     (new method)                   │
│               └──────────┬──────────┘                                    │
└──────────────────────────┼───────────────────────────────────────────────┘
                           │
                           │ supabase.rpc('complete_group_exercise', {...})
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (RPC Function)                              │
│                                                                          │
│  complete_group_exercise(                                                │
│    p_session_exercise_id UUID,                                          │
│    p_session_date DATE,                                                 │
│    p_exercise_id UUID                                                   │
│  ) RETURNS TABLE(updated_session_exercise_id UUID)                      │
│                                                                          │
│  [SECURITY INVOKER - respects RLS]                                      │
│  [Entire function runs in single transaction]                            │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           │ UPDATE triggers postgres_changes
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Supabase Realtime                                      │
│                                                                          │
│  Channel: 'session_exercises_changes'                                    │
│  Event: postgres_changes on session_exercises table                      │
│  Filter: session_date=eq.{date}                                          │
│                                                                          │
│  [Each updated row emits separate event]                                 │
│  [All subscribed tablets receive updates]                                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `TabletLive.tsx` | UI rendering, user interactions | useLiveCoaching hook |
| `useLiveCoaching` hook | State management, optimistic updates, DB calls | Supabase client, Realtime |
| `complete_group_exercise` RPC | Atomic batch update, date/exercise matching | PostgreSQL tables |
| Supabase Realtime | Push notifications for row changes | All subscribed clients |

### Data Flow

1. **User Action**: Coach taps "Complete" on a group exercise
2. **Hook Detection**: `useLiveCoaching.completeExercise()` checks if `is_group=true`
3. **Optimistic Update**: Hook immediately updates local state for ALL matching exercises across all sessions
4. **RPC Call**: Hook calls `supabase.rpc('complete_group_exercise', {...})`
5. **Atomic Update**: PostgreSQL function updates all matching rows in single transaction
6. **Realtime Events**: Each updated row triggers a `postgres_changes` event
7. **State Reconciliation**: Other tablets receive events and update their local state

## Patterns to Follow

### Pattern 1: PostgreSQL RPC for Atomic Batch Updates

**What:** Use a PostgreSQL function called via `supabase.rpc()` for multi-row updates that must be atomic.

**Why:** PostgREST wraps RPC calls in a transaction automatically. All operations inside the function succeed or fail together.

**When:** Any operation that must update multiple rows atomically (group exercise completion, bulk status changes).

**Example:**

```sql
-- Migration: Create RPC function for group exercise completion
CREATE OR REPLACE FUNCTION public.complete_group_exercise(
  p_session_exercise_id UUID,
  p_session_date DATE,
  p_exercise_id UUID
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER  -- IMPORTANT: Respects RLS policies
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ := NOW();
BEGIN
  -- Update all matching group exercises for this date
  -- RLS automatically filters to coach's clients only
  RETURN QUERY
  UPDATE public.session_exercises se
  SET
    completed = true,
    completed_at = v_completed_at,
    skipped = false
  FROM public.sessions s
  WHERE se.session_id = s.id
    AND s.session_date = p_session_date
    AND se.exercise_id = p_exercise_id
    AND se.is_group = true
  RETURNING se.id AS updated_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_group_exercise TO authenticated;
```

**Hook Integration:**

```typescript
const completeGroupExercise = useCallback(
  async (
    sessionExerciseId: string,
    sessionDate: string,
    exerciseId: string
  ): Promise<string[]> => {
    // Optimistic update for ALL matching exercises
    const completedAt = new Date().toISOString();
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        exercises: session.exercises?.map((ex) =>
          ex.exercise_id === exerciseId && ex.is_group
            ? { ...ex, completed: true, skipped: false, completed_at: completedAt }
            : ex
        ),
      }))
    );

    // Single atomic RPC call
    const { data, error } = await supabase.rpc('complete_group_exercise', {
      p_session_exercise_id: sessionExerciseId,
      p_session_date: sessionDate,
      p_exercise_id: exerciseId,
    });

    if (error) {
      // Rollback optimistic update on error
      await fetchSessionsForDate(sessionDate);
      throw error;
    }

    return data?.map((r: { updated_id: string }) => r.updated_id) || [];
  },
  [fetchSessionsForDate]
);
```

### Pattern 2: SECURITY INVOKER for RLS Compliance

**What:** Use `SECURITY INVOKER` (not `SECURITY DEFINER`) for RPC functions that should respect Row Level Security.

**Why:** With `SECURITY INVOKER`, the function runs with the privileges of the calling user, so existing RLS policies on `session_exercises` and `sessions` are enforced. The coach can only update exercises belonging to their own clients.

**When:** Any RPC function that modifies user-owned data and must respect tenant isolation.

**Example:**

```sql
-- SECURITY INVOKER makes this function respect RLS
CREATE OR REPLACE FUNCTION public.complete_group_exercise(...)
LANGUAGE plpgsql
SECURITY INVOKER  -- Runs as the authenticated user
AS $$
  -- RLS policy "Users can update exercises of their sessions" is enforced
  UPDATE public.session_exercises ...
$$;
```

**Verification:**
The existing RLS policy on `session_exercises`:
```sql
create policy "Users can update exercises of their sessions"
  on public.session_exercises for update
  using (exists (
    select 1 from public.sessions s
    join public.clients c on c.id = s.client_id
    where s.id = session_exercises.session_id
    and c.user_id = auth.uid()
  ));
```

This policy is automatically applied to updates within the RPC function when using `SECURITY INVOKER`.

### Pattern 3: Realtime Subscription with Table Filter

**What:** Subscribe to `postgres_changes` on `session_exercises` with a filter for the current date.

**Why:** Only receive events relevant to the current coaching session, reducing noise and improving performance.

**When:** Real-time sync is needed but you want to limit the event stream.

**Example:**

```typescript
// In useLiveCoaching hook
useEffect(() => {
  if (!currentDate) return;

  const channel = supabase
    .channel(`session_exercises_${currentDate}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_exercises',
        // Note: Cannot filter by session_date directly as it's on sessions table
        // Will filter in the handler
      },
      (payload) => {
        const updated = payload.new as SessionExercise;
        setSessions((prev) =>
          prev.map((session) => ({
            ...session,
            exercises: session.exercises?.map((ex) =>
              ex.id === updated.id ? { ...ex, ...updated } : ex
            ),
          }))
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentDate]);
```

### Pattern 4: Optimistic Updates with Rollback

**What:** Update local state immediately before the database call, then reconcile if the call fails.

**Why:** Provides instant feedback to the user. The coach sees the group exercise marked complete immediately, without waiting for the round-trip.

**When:** Any user action that modifies data and has a clear expected outcome.

**Example:**

```typescript
const completeGroupExercise = async (...) => {
  // 1. Optimistic update
  const previousSessions = sessions; // Store for rollback
  setSessions((prev) => /* apply optimistic changes */);

  try {
    // 2. Database call
    const { error } = await supabase.rpc('complete_group_exercise', {...});
    if (error) throw error;

    // 3. Success - optimistic update was correct
    setSaveStatus('saved');
  } catch (err) {
    // 4. Rollback on error
    setSessions(previousSessions);
    // OR: Refetch to get authoritative state
    await fetchSessionsForDate(sessionDate);
    setSaveStatus('error');
  }
};
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Multiple Sequential Updates from Client

**What:** Calling `supabase.from('session_exercises').update()` in a loop for each matching exercise.

**Why Bad:**
- Not atomic: Some updates may succeed while others fail
- Slow: N round trips for N exercises
- Race conditions: Other clients may see partial updates

**Instead:** Use a single RPC function that updates all matching rows in one transaction.

```typescript
// BAD - multiple round trips, not atomic
for (const exercise of groupExercises) {
  await supabase
    .from('session_exercises')
    .update({ completed: true })
    .eq('id', exercise.id);
}

// GOOD - single atomic call
await supabase.rpc('complete_group_exercise', {
  p_session_date: date,
  p_exercise_id: exerciseId,
});
```

### Anti-Pattern 2: SECURITY DEFINER for User Data

**What:** Creating RPC functions with `SECURITY DEFINER` that modify user-owned data.

**Why Bad:**
- Bypasses RLS, allowing potential access to other users' data
- Security vulnerability if function parameters are not properly validated
- Must manually implement access checks inside the function

**Instead:** Use `SECURITY INVOKER` and let RLS handle authorization automatically.

### Anti-Pattern 3: Polling Instead of Realtime

**What:** Using `setInterval` to repeatedly fetch session data instead of subscribing to realtime updates.

**Why Bad:**
- Wastes bandwidth and database resources
- Updates are delayed by poll interval
- Doesn't scale with number of clients

**Instead:** Subscribe to `postgres_changes` for the relevant table.

### Anti-Pattern 4: Realtime Without Optimistic Updates

**What:** Waiting for realtime events before updating the UI.

**Why Bad:**
- User experiences delay between action and feedback
- Feels unresponsive on slow connections

**Instead:** Apply optimistic updates immediately, use realtime to sync other clients and handle conflicts.

## Migration Requirements

### Database Migration

```sql
-- 1. Add is_group column to session_exercises
ALTER TABLE public.session_exercises
ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false;

-- 2. Add index for efficient group exercise queries
CREATE INDEX session_exercises_is_group_idx
ON public.session_exercises(is_group)
WHERE is_group = true;

-- 3. Create RPC function
CREATE OR REPLACE FUNCTION public.complete_group_exercise(
  p_session_exercise_id UUID,
  p_session_date DATE,
  p_exercise_id UUID
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  UPDATE public.session_exercises se
  SET
    completed = true,
    completed_at = v_completed_at,
    skipped = false
  FROM public.sessions s
  WHERE se.session_id = s.id
    AND s.session_date = p_session_date
    AND se.exercise_id = p_exercise_id
    AND se.is_group = true
  RETURNING se.id AS updated_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_group_exercise TO authenticated;

-- 4. Create similar function for skip_group_exercise
CREATE OR REPLACE FUNCTION public.skip_group_exercise(
  p_session_exercise_id UUID,
  p_session_date DATE,
  p_exercise_id UUID
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.session_exercises se
  SET
    skipped = true,
    completed = false,
    completed_at = NULL
  FROM public.sessions s
  WHERE se.session_id = s.id
    AND s.session_date = p_session_date
    AND se.exercise_id = p_exercise_id
    AND se.is_group = true
  RETURNING se.id AS updated_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.skip_group_exercise TO authenticated;

-- 5. Enable realtime for session_exercises
ALTER PUBLICATION supabase_realtime ADD TABLE session_exercises;
ALTER TABLE session_exercises REPLICA IDENTITY FULL;
```

### Hook Modifications

The `useLiveCoaching` hook needs:

1. **New method `completeGroupExercise`**: Calls RPC, handles optimistic updates
2. **New method `skipGroupExercise`**: Similar for skip action
3. **Modified `completeExercise`**: Detect `is_group` and delegate to group method
4. **Modified `skipExercise`**: Detect `is_group` and delegate to group method
5. **Realtime subscription**: Subscribe to `session_exercises` changes for current date

### Type Updates

```typescript
// In types/index.ts
export interface SessionExercise {
  // ... existing fields
  is_group: boolean;  // NEW
}

export interface SessionExerciseInsert {
  // ... existing fields
  is_group?: boolean;  // NEW
}
```

## Scalability Considerations

| Concern | Current Scale (1 coach) | 10 Coaches | 100 Coaches |
|---------|-------------------------|------------|-------------|
| Realtime subscriptions | 1-2 tablets | 10-20 tablets | 100-200 tablets |
| Events per group complete | 2-5 rows | 2-5 rows per coach | Same (isolated by RLS) |
| RPC function execution | < 10ms | < 10ms | < 10ms |
| Realtime delivery | < 100ms | < 100ms | May need Broadcast |

**At 100+ concurrent tablets:**
- Consider using `realtime.broadcast_changes()` trigger instead of `postgres_changes`
- Allows custom payloads and better control over what's sent
- See [Realtime Broadcast from Database](https://supabase.com/blog/realtime-broadcast-from-database)

## Sources

- [Supabase RPC JavaScript Reference](https://supabase.com/docs/reference/javascript/rpc) - HIGH confidence
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - HIGH confidence
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - HIGH confidence
- [Supabase Realtime Broadcast from Database](https://supabase.com/blog/realtime-broadcast-from-database) - MEDIUM confidence (for scaling recommendations)
- [Database Transactions Discussion](https://github.com/supabase/supabase/discussions/526) - MEDIUM confidence
- [Transactions and RLS in Edge Functions](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) - LOW confidence (external source)

## Summary

**Recommendation:** Use PostgreSQL RPC functions with `SECURITY INVOKER` for atomic group exercise updates. The function runs in a single transaction, respects existing RLS policies, and triggers realtime events for all updated rows. The hook applies optimistic updates before calling RPC and subscribes to realtime for cross-tablet sync.

**Key architectural decisions:**
1. **RPC over multiple client-side updates** - Atomicity guarantee
2. **SECURITY INVOKER over DEFINER** - RLS compliance without custom auth logic
3. **Optimistic updates + Realtime** - Instant feedback + eventual consistency
4. **Table-level realtime subscription** - Simpler than broadcast, sufficient at current scale
