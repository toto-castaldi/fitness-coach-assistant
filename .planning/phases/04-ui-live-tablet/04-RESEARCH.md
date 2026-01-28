# Phase 4: UI Live Tablet - Research

**Researched:** 2026-01-28
**Domain:** Live coaching tablet UI with group exercise support
**Confidence:** HIGH

## Summary

This phase adds group exercise functionality to the tablet live coaching interface (TabletLive.tsx). The core changes are:

1. A tab/toggle to switch between "Individuali" (current behavior) and "Gruppo" views
2. A new group view showing all group exercises from all sessions of the day
3. Complete-for-all functionality using PostgreSQL RPC for atomic batch updates
4. Realtime sync to update all connected tablets when group exercises change
5. Skip-per-individual functionality to exclude specific clients from group completion

The existing codebase already has all required infrastructure: useLiveCoaching hook with optimistic updates, ExerciseCard component, ClientAvatar for participants, sonner for toast notifications, and established patterns for realtime subscriptions (useRepositories.ts).

**Primary recommendation:** Follow existing patterns exactly. Build a simple toggle using Button components (no new Tabs dependency needed), create a GroupExerciseView component that aggregates exercises by exercise_id, and extend useLiveCoaching with RPC-based group completion.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed - No Changes)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | Latest | UI framework | Already handles optimistic updates in useLiveCoaching |
| Supabase | Latest | Backend + Realtime | Native RPC, postgres_changes already used |
| sonner | ^2.0.7 | Toast notifications | Already configured in AppLive.tsx with Toaster |
| Tailwind CSS | 3.x | Styling | Consistent with existing tablet UI |
| lucide-react | Latest | Icons (Users, Check) | Already used throughout live components |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/shared/components/ui/button | shadcn | Toggle buttons | For Individuali/Gruppo toggle |
| @/shared/components/ui/badge | shadcn | Visual indicators | For group badge on cards |
| @/live/components/ClientAvatar | Custom | Participant display | For showing participants on group exercises |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Button toggle | shadcn/ui Tabs | Tabs not installed, Button toggle matches ActionPanel style |
| sonner toast | Custom undo dialog | sonner already configured, familiar undo pattern |
| RPC function | Client-side .in() updates | RPC is atomic, .in() requires multiple round trips |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure

```
src/live/
├── pages/
│   └── TabletLive.tsx              # Modified: add view toggle state
├── components/
│   ├── ExerciseCarousel.tsx        # Existing: individual view
│   ├── GroupExerciseView.tsx       # NEW: group view component
│   ├── GroupExerciseCard.tsx       # NEW: card with participants
│   ├── ExerciseCard.tsx            # Modified: add is_group badge
│   └── ActionPanel.tsx             # Modified: context-aware buttons
src/shared/
├── hooks/
│   └── useLiveCoaching.ts          # Modified: add group functions
supabase/
├── migrations/
│   └── 00000000000018_group_rpc.sql # NEW: RPC functions
```

### Pattern 1: View Mode Toggle with Button Group

**What:** Simple two-button toggle styled like ActionPanel buttons
**When to use:** Phase 4 tab toggle requirement
**Example:**
```typescript
// Source: Follows ActionPanel button styling pattern
const [viewMode, setViewMode] = useState<'individual' | 'group'>('individual')

<div className="flex gap-2">
  <Button
    onClick={() => setViewMode('individual')}
    className={cn(
      'px-4 py-2',
      viewMode === 'individual'
        ? 'bg-primary text-white'
        : 'bg-gray-700 text-gray-300'
    )}
  >
    Individuali
  </Button>
  <Button
    onClick={() => setViewMode('group')}
    className={cn(
      'px-4 py-2',
      viewMode === 'group'
        ? 'bg-primary text-white'
        : 'bg-gray-700 text-gray-300'
    )}
  >
    <Users className="w-4 h-4 mr-2" />
    Gruppo
  </Button>
</div>
```

### Pattern 2: Group Exercise Aggregation

**What:** Group session_exercises by exercise_id and date to show unique group exercises
**When to use:** Building the group view data
**Example:**
```typescript
// Source: Derived from existing sessions data structure
interface GroupedExercise {
  exerciseId: string
  exerciseName: string
  exercise: ExerciseWithDetails
  participants: Array<{
    sessionExerciseId: string
    client: Client
    completed: boolean
    skipped: boolean
  }>
  allCompleted: boolean
  someCompleted: boolean
}

const groupExercisesByExerciseId = (sessions: SessionWithDetails[]): GroupedExercise[] => {
  const grouped = new Map<string, GroupedExercise>()

  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      if (!ex.is_group) continue

      const exerciseId = ex.exercise_id
      if (!grouped.has(exerciseId)) {
        grouped.set(exerciseId, {
          exerciseId,
          exerciseName: ex.exercise?.name || 'Esercizio',
          exercise: ex.exercise!,
          participants: [],
          allCompleted: true,
          someCompleted: false,
        })
      }

      const group = grouped.get(exerciseId)!
      group.participants.push({
        sessionExerciseId: ex.id,
        client: session.client!,
        completed: ex.completed,
        skipped: ex.skipped,
      })

      if (!ex.completed && !ex.skipped) group.allCompleted = false
      if (ex.completed) group.someCompleted = true
    }
  }

  return Array.from(grouped.values())
}
```

### Pattern 3: RPC for Atomic Batch Updates

**What:** PostgreSQL function with SECURITY INVOKER for group completion
**When to use:** Complete-for-all action
**Example:**
```sql
-- Source: Architecture research document
CREATE OR REPLACE FUNCTION public.complete_group_exercise(
  p_session_date DATE,
  p_exercise_id UUID
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER  -- Respects RLS policies
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
    AND se.completed = false  -- Only update non-completed
  RETURNING se.id AS updated_id;
END;
$$;
```

### Pattern 4: Toast with Undo Action

**What:** sonner toast with action button for quick undo
**When to use:** After complete-for-all action (3-5 second window)
**Example:**
```typescript
// Source: sonner documentation + CONTEXT.md decision
import { toast } from 'sonner'

const handleCompleteForAll = async (exerciseId: string, exerciseName: string) => {
  // Store previous state for undo
  const previousState = sessions.map(s => ({
    sessionId: s.id,
    exercises: s.exercises?.filter(e => e.exercise_id === exerciseId && e.is_group)
      .map(e => ({ id: e.id, completed: e.completed, skipped: e.skipped }))
  }))

  // Optimistic update
  completeGroupExercise(date, exerciseId)

  // Show toast with undo
  toast.success(`${exerciseName} completato per tutti`, {
    duration: 4000,  // 4 seconds as per CONTEXT.md
    action: {
      label: 'Annulla',
      onClick: () => undoGroupComplete(previousState)
    }
  })
}
```

### Pattern 5: Realtime Subscription for Group Sync

**What:** Subscribe to session_exercises changes for cross-tablet updates
**When to use:** When multiple tablets may be viewing group exercises
**Example:**
```typescript
// Source: useRepositories.ts pattern
useEffect(() => {
  if (!currentDate) return

  const channel = supabase
    .channel(`session_exercises_${currentDate}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_exercises',
      },
      (payload) => {
        const updated = payload.new as SessionExercise
        setSessions((prev) =>
          prev.map((session) => ({
            ...session,
            exercises: session.exercises?.map((ex) =>
              ex.id === updated.id
                ? { ...ex, completed: updated.completed, skipped: updated.skipped, completed_at: updated.completed_at }
                : ex
            ),
          }))
        )
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [currentDate])
```

### Anti-Patterns to Avoid

- **Client-side loop updates:** Don't call `.update()` in a loop for each participant. Use RPC for atomicity.
- **SECURITY DEFINER for RPC:** Use SECURITY INVOKER to respect RLS policies.
- **Blocking confirmation dialogs:** Use non-blocking toast with undo, not modal dialogs.
- **Polling for updates:** Use realtime subscription, not setInterval.
- **Rebuilding ExerciseCard:** Extend existing component with optional is_group badge.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | sonner (already configured) | Consistent, supports actions |
| Atomic batch updates | Client-side .in() filter | PostgreSQL RPC | Transaction guarantee |
| Realtime sync | Polling with setInterval | Supabase postgres_changes | Efficient, push-based |
| Button toggle UI | Custom toggle component | Styled Button group | Matches ActionPanel aesthetic |
| Client avatars | New avatar component | ClientAvatar (exists) | Already styled for tablet |

**Key insight:** The codebase already has all the building blocks. The phase is about composition, not creation.

## Common Pitfalls

### Pitfall 1: Non-Atomic Group Updates

**What goes wrong:** Calling `.update().in([ids])` from client leaves partial state if network fails
**Why it happens:** PostgREST doesn't wrap client-side .in() in a transaction
**How to avoid:** Use RPC function that updates all matching rows atomically
**Warning signs:** Some exercises marked complete while others aren't after completion

### Pitfall 2: Realtime Without Table Publication

**What goes wrong:** Realtime subscription doesn't receive updates
**Why it happens:** Table not added to supabase_realtime publication
**How to avoid:** Run migration to enable realtime on session_exercises
**Warning signs:** Changes don't appear on other tablets

### Pitfall 3: RLS Bypass with SECURITY DEFINER

**What goes wrong:** RPC function updates exercises for other coaches
**Why it happens:** SECURITY DEFINER runs with function owner privileges
**How to avoid:** Use SECURITY INVOKER to inherit caller's RLS context
**Warning signs:** Coach A can complete coach B's exercises

### Pitfall 4: Blocking Undo UX

**What goes wrong:** Coach waits for confirmation before marking complete
**Why it happens:** Using modal dialog instead of toast with undo
**How to avoid:** Immediate optimistic update + toast with undo action
**Warning signs:** UX feels slow compared to individual completion

### Pitfall 5: Missing Date Filter in Group Query

**What goes wrong:** Group view shows exercises from other days
**Why it happens:** Forgetting to filter sessions by current date
**How to avoid:** Always filter by session_date in aggregation
**Warning signs:** Exercises from past sessions appear in group view

## Code Examples

Verified patterns from official sources and existing codebase:

### Group Exercise RPC Function

```sql
-- Source: Supabase RPC documentation + Architecture research
CREATE OR REPLACE FUNCTION public.complete_group_exercise(
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
    AND se.completed = false
  RETURNING se.id AS updated_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_group_exercise TO authenticated;

-- Enable realtime for session_exercises
ALTER PUBLICATION supabase_realtime ADD TABLE session_exercises;
ALTER TABLE session_exercises REPLICA IDENTITY FULL;
```

### Skip Individual Function

```sql
-- Source: Architecture research
CREATE OR REPLACE FUNCTION public.skip_group_exercise_for_client(
  p_session_exercise_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.session_exercises
  SET
    skipped = true,
    completed = false,
    completed_at = NULL
  WHERE id = p_session_exercise_id
    AND is_group = true;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.skip_group_exercise_for_client TO authenticated;
```

### Hook Extension Pattern

```typescript
// Source: useLiveCoaching.ts existing pattern
const completeGroupExercise = useCallback(
  async (sessionDate: string, exerciseId: string): Promise<string[]> => {
    const completedAt = new Date().toISOString()

    // Optimistic update for ALL matching exercises
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        exercises: session.exercises?.map((ex) =>
          ex.exercise_id === exerciseId && ex.is_group && !ex.completed
            ? { ...ex, completed: true, skipped: false, completed_at: completedAt }
            : ex
        ),
      }))
    )

    const result = await withSaveTracking(async () => {
      const { data, error } = await supabase.rpc('complete_group_exercise', {
        p_session_date: sessionDate,
        p_exercise_id: exerciseId,
      })

      if (error) throw new Error(error.message)
      return data?.map((r: { updated_id: string }) => r.updated_id) || []
    })

    if (result === null) {
      // Rollback: refetch to get authoritative state
      await fetchSessionsForDate(sessionDate)
      return []
    }

    return result
  },
  [withSaveTracking, fetchSessionsForDate]
)
```

### Toast with Undo Pattern

```typescript
// Source: sonner documentation
import { toast } from 'sonner'

const handleGroupComplete = async (exercise: GroupedExercise) => {
  const previousState = captureGroupState(exercise.exerciseId)

  const updatedIds = await completeGroupExercise(currentDate, exercise.exerciseId)

  if (updatedIds.length > 0) {
    toast.success(`${exercise.exerciseName} completato per tutti`, {
      duration: 4000,
      action: {
        label: 'Annulla',
        onClick: async () => {
          await undoGroupComplete(previousState)
          toast.info('Completamento annullato')
        }
      }
    })
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple client updates | RPC atomic batch | 2024 best practice | Atomicity guaranteed |
| Polling for sync | Realtime postgres_changes | Supabase standard | Push-based, efficient |
| Modal confirmations | Toast with undo | UX best practice | Non-blocking, faster |

**Deprecated/outdated:**
- SECURITY DEFINER for user-data RPC: Use SECURITY INVOKER instead
- Client-side batch updates with .in(): Use RPC for transactions

## Open Questions

Things that couldn't be fully resolved:

1. **Exact toast position for tablet landscape**
   - What we know: Toaster configured with `position="top-center"` in AppLive.tsx
   - What's unclear: Optimal position given header and ActionPanel
   - Recommendation: Keep top-center, matches existing config

2. **Realtime performance at scale**
   - What we know: Single coach use case, 1-2 tablets
   - What's unclear: Performance with 10+ tablets
   - Recommendation: Current approach sufficient, monitor if needed

3. **Undo timeout exact duration**
   - What we know: CONTEXT.md says 3-5 seconds
   - What's unclear: Exact user preference
   - Recommendation: Use 4 seconds (middle ground)

## Sources

### Primary (HIGH confidence)
- **Codebase:** useLiveCoaching.ts - Optimistic update patterns
- **Codebase:** useRepositories.ts - Realtime subscription pattern
- **Codebase:** AppLive.tsx - sonner Toaster configuration
- **Codebase:** ExerciseCard.tsx, ActionPanel.tsx - UI component patterns
- **Research:** .planning/research/ARCHITECTURE.md - RPC patterns
- **Research:** .planning/research/STACK.md - Stack verification

### Secondary (MEDIUM confidence)
- [Supabase RPC Documentation](https://supabase.com/docs/reference/javascript/rpc) - RPC patterns
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Subscription API
- [sonner Documentation](https://sonner.emilkowal.ski/) - Toast with actions

### Tertiary (LOW confidence)
- None required - all patterns verified in codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and configured
- Architecture: HIGH - Patterns derived from existing codebase
- Pitfalls: HIGH - Based on official documentation and best practices

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable patterns, no fast-moving deps)
