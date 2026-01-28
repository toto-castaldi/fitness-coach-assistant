# Phase 3: UI Pianificazione - Research

**Researched:** 2026-01-28
**Domain:** React UI components for toggle and visual indicators
**Confidence:** HIGH

## Summary

This phase adds a toggle for "di gruppo" (group exercise) to the SessionDetail page and visual indicators in the exercise list. The research focused on understanding existing codebase patterns and available UI components.

The project already has a robust pattern for exercise toggles in `SessionExerciseCard.tsx` - the "Saltato" (skipped) toggle provides the exact template to follow. The `Switch` component from shadcn/ui is already in use, and the `Badge` component with the `secondary` variant matches the existing tag styling. The `Users` icon from lucide-react is already imported in the project and semantically represents group exercises.

The `useSessions` hook already supports `is_group` in the `SessionExerciseUpdate` type - no hook changes are needed. The types in `shared/types/index.ts` are complete with `is_group` in both `SessionExercise`, `SessionExerciseInsert`, and `SessionExerciseUpdate`.

**Primary recommendation:** Follow the existing "Saltato" toggle pattern exactly - add a second toggle row below it for "Di gruppo" with Users icon, and add a Badge with Users icon in the exercise header.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in use |
| shadcn/ui | Latest | UI components | Project standard |
| lucide-react | Latest | Icons | Project standard |
| Tailwind CSS | Latest | Styling | Project standard |

### Components Already Available
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Switch | `@/components/ui/switch` | Toggle control | Already used for "Saltato" |
| Badge | `@/components/ui/badge` | Tag/indicator display | Already used for exercise tags |
| Label | `@/components/ui/label` | Form labels | Already used for toggle labels |
| Users | lucide-react | Group icon | Already imported in project |

### No New Dependencies Required
All components needed are already installed and in use in the project.

## Architecture Patterns

### Existing Pattern: Toggle in SessionExerciseCard

The "Saltato" toggle in `SessionExerciseCard.tsx` (lines 262-272) is the exact pattern to replicate:

```typescript
// Source: /home/toto/scm-projects/helix/src/components/sessions/SessionExerciseCard.tsx
{/* Skipped toggle */}
<div className="flex items-center justify-between pt-2 border-t">
  <Label htmlFor={`skipped-${exercise.id}`} className="text-xs text-muted-foreground">
    Saltato
  </Label>
  <Switch
    id={`skipped-${exercise.id}`}
    checked={exercise.skipped || false}
    onCheckedChange={(checked) => onUpdate(exercise.id, { skipped: checked })}
  />
</div>
```

### Recommended Pattern: Group Toggle

Add after the skipped toggle, following the same pattern:

```typescript
{/* Group toggle */}
<div className="flex items-center justify-between pt-2 border-t">
  <div className="flex items-center gap-2">
    <Users className="h-3.5 w-3.5 text-muted-foreground" />
    <Label htmlFor={`group-${exercise.id}`} className="text-xs text-muted-foreground">
      Di gruppo
    </Label>
  </div>
  <Switch
    id={`group-${exercise.id}`}
    checked={exercise.is_group || false}
    onCheckedChange={(checked) => onUpdate(exercise.id, { is_group: checked })}
  />
</div>
```

### Existing Pattern: Badge Display in Exercise Header

Exercise tags use Badge with secondary variant (ExercisePicker.tsx lines 82-96):

```typescript
// Source: /home/toto/scm-projects/helix/src/components/sessions/ExercisePicker.tsx
{exercise.tags && exercise.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1">
    {exercise.tags.map((t) => (
      <Badge
        key={t.id}
        variant="secondary"
        className="text-xs"
      >
        {t.tag}
      </Badge>
    ))}
  </div>
)}
```

### Recommended Pattern: Group Indicator Badge

Display inline with exercise name or as separate indicator:

```typescript
{/* Group indicator */}
{exercise.is_group && (
  <Badge variant="secondary" className="text-xs gap-1">
    <Users className="h-3 w-3" />
    Gruppo
  </Badge>
)}
```

### Recommended Pattern: Summary Count

In SessionDetail header, add count summary:

```typescript
{/* Group exercises summary */}
{groupExercisesCount > 0 && (
  <span className="text-sm text-muted-foreground ml-2">
    ({groupExercisesCount} di gruppo)
  </span>
)}
```

Where count is calculated as:
```typescript
const groupExercisesCount = session.exercises?.filter(e => e.is_group).length || 0
```

### Project Structure

No new files needed. Modifications to existing files:

```
src/
├── components/sessions/
│   └── SessionExerciseCard.tsx  # Add group toggle + indicator
├── pages/
│   └── SessionDetail.tsx        # Add summary count
```

### Anti-Patterns to Avoid

- **Separate modal for group toggle:** Keep inline like skipped toggle
- **Custom toggle component:** Use existing Switch from shadcn/ui
- **Confirmation dialogs:** User decisions specify instant toggle, fully reversible
- **Bulk toggle actions:** User decisions specify one at a time

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle control | Custom checkbox | shadcn/ui Switch | Accessibility, styling consistency |
| Visual indicator | Custom styled div | shadcn/ui Badge | Already used for tags, consistent |
| Group icon | Custom SVG | lucide-react Users | Already in project, semantic |

**Key insight:** Every UI element needed already exists in the project. This is a composition task, not a creation task.

## Common Pitfalls

### Pitfall 1: Forgetting Optimistic Updates
**What goes wrong:** Toggle feels slow if waiting for DB response
**Why it happens:** Standard async pattern waits for response
**How to avoid:** Follow existing pattern in SessionExerciseCard - update local state immediately, then persist to DB in background
**Warning signs:** Toggle state flickers or has noticeable delay

### Pitfall 2: Missing is_group in Add Exercise Flow
**What goes wrong:** New exercises always have is_group=false even when adding during group-focused session
**Why it happens:** Context requirement mentions "option to mark as 'di gruppo' visible during add flow"
**How to avoid:** Add option in ExercisePicker or as part of handleAddExercise
**Warning signs:** Coach cannot mark exercise as group during initial add

### Pitfall 3: Not Preserving is_group on Session Operations
**What goes wrong:** is_group flag lost when duplicating session
**Why it happens:** Incomplete data copying
**How to avoid:** MCP already handles this (verified in code), but any frontend duplication must include is_group
**Warning signs:** Duplicated sessions lose group exercise flags

### Pitfall 4: Inconsistent Visual Prominence
**What goes wrong:** Group indicator either too subtle or too loud
**Why it happens:** Not matching existing UI patterns
**How to avoid:** Use Badge variant="secondary" to match tag styling
**Warning signs:** Group exercises don't fit visually with rest of UI

## Code Examples

Verified patterns from existing codebase:

### Optimistic Update Pattern
```typescript
// Source: /home/toto/scm-projects/helix/src/pages/SessionDetail.tsx (lines 114-127)
// Optimistic update for exercise fields
const handleUpdateExercise = (exerciseId: string, updates: SessionExerciseUpdate) => {
  if (!session?.exercises) return

  // Update local state immediately
  setSession({
    ...session,
    exercises: session.exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ),
  })

  // Save to DB in background
  updateExercise(exerciseId, updates)
}
```

### useSessions Hook Already Supports is_group
```typescript
// Source: /home/toto/scm-projects/helix/src/hooks/useSessions.ts (lines 195-213)
const updateExercise = async (
  id: string,
  updates: SessionExerciseUpdate  // Already includes is_group
): Promise<SessionExercise | null> => {
  const { data, error: updateError } = await supabase
    .from('session_exercises')
    .update(updates)  // Passes is_group directly
    .eq('id', id)
    .select()
    .single()
  // ...
}
```

### Exercise Type Already Has is_group
```typescript
// Source: /home/toto/scm-projects/helix/src/shared/types/index.ts (lines 120-153)
export interface SessionExercise {
  // ...
  is_group: boolean  // Already defined
}

export interface SessionExerciseUpdate extends Partial<Omit<SessionExerciseInsert, 'session_id'>> {
  // ...
  is_group?: boolean  // Already defined
}
```

### Add Exercise Already Handles is_group
```typescript
// Source: /home/toto/scm-projects/helix/src/pages/SessionDetail.tsx (lines 77-111)
const handleAddExercise = async (exercise: ExerciseWithDetails) => {
  // ...
  const newExercise: SessionExerciseWithDetails = {
    // ...
    is_group: false,  // Already set default
    // ...
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI planning internal | MCP external | Phase 2 (complete) | AI can suggest is_group via create_training_plan tool |

**Current capabilities:**
- MCP `add_session_exercise` already accepts `is_group` parameter
- MCP `update_session_exercise` already accepts `is_group` parameter
- MCP `create_training_plan` already accepts `is_group` per exercise
- MCP `duplicate_session` already preserves `is_group` status

## Open Questions

None - all aspects of the implementation are well-defined by:
1. User decisions in CONTEXT.md
2. Existing code patterns in SessionExerciseCard.tsx
3. Available UI components (Switch, Badge, Users icon)
4. Type definitions already including is_group

## Sources

### Primary (HIGH confidence)
- `/home/toto/scm-projects/helix/src/components/sessions/SessionExerciseCard.tsx` - Toggle pattern reference
- `/home/toto/scm-projects/helix/src/pages/SessionDetail.tsx` - Optimistic update patterns
- `/home/toto/scm-projects/helix/src/hooks/useSessions.ts` - Hook already supports is_group
- `/home/toto/scm-projects/helix/src/shared/types/index.ts` - Types already complete
- `/home/toto/scm-projects/helix/supabase/functions/helix-mcp/index.ts` - MCP already supports is_group

### Secondary (MEDIUM confidence)
- [shadcn/ui Switch documentation](https://ui.shadcn.com/docs/components/switch) - Component API
- [shadcn/ui Badge documentation](https://ui.shadcn.com/docs/components/badge) - Variant options
- [Lucide React Users icon](https://lucide.dev/icons/users) - Icon reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in project
- Architecture: HIGH - Exact pattern exists (Saltato toggle)
- Pitfalls: HIGH - Based on codebase analysis

**Research date:** 2026-01-28
**Valid until:** Stable - no external dependencies to change
