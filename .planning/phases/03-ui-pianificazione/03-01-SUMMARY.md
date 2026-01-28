---
phase: 03-ui-pianificazione
plan: 01
subsystem: ui
tags: [react, tailwind, shadcn, toggle, badge]

# Dependency graph
requires:
  - phase: 01-database-schema
    provides: is_group column in session_exercises table
  - phase: 02-mcp-server-integration
    provides: is_group in MCP resources and tools
provides:
  - Group toggle in SessionExerciseCard
  - Group badge indicator in exercise header
  - Group exercises summary count in SessionDetail header
affects: [04-ui-live-tablet]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Follow existing toggle pattern (Saltato style)"
    - "Badge with icon for visual indicators"

key-files:
  created: []
  modified:
    - src/components/sessions/SessionExerciseCard.tsx
    - src/pages/SessionDetail.tsx

key-decisions:
  - "Followed existing Saltato toggle pattern exactly for consistency"
  - "Badge with Users icon shows when is_group=true"
  - "Summary count only shows when > 0 group exercises"

patterns-established:
  - "Group toggle: Switch below Saltato toggle with Users icon in label"
  - "Group badge: Badge variant=secondary with Users icon and 'Gruppo' text"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 3 Plan 1: UI Pianificazione - Group Toggle Summary

**Di gruppo toggle and badge in SessionExerciseCard with summary count in SessionDetail header**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28
- **Completed:** 2026-01-28
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added "Di gruppo" toggle to SessionExerciseCard following existing "Saltato" pattern
- Added "Gruppo" badge with Users icon next to exercise name when is_group=true
- Added "X di gruppo" summary count in SessionDetail exercises header (only when > 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add group toggle and badge to SessionExerciseCard** - `bce14fb` (feat)
2. **Task 2: Add group exercises summary count to SessionDetail** - `e692d27` (feat)

## Files Created/Modified

- `src/components/sessions/SessionExerciseCard.tsx` - Added Users icon, Badge import, group badge in header, "Di gruppo" toggle below "Saltato"
- `src/pages/SessionDetail.tsx` - Added Users icon, group exercises count in exercises section header

## Decisions Made

- **Followed existing toggle pattern exactly:** The "Di gruppo" toggle mirrors the "Saltato" toggle structure for UI consistency
- **Badge with Users icon:** Visual indicator that matches the toggle icon for clear association
- **Summary count position:** Placed next to main count, not on separate line, to avoid visual clutter
- **Conditional rendering:** Summary count only shown when at least one exercise is marked as group

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Group toggle and visual feedback complete for planning UI
- Ready for Phase 4: UI Live Tablet implementation
- Same is_group field can be displayed in live session view

---
*Phase: 03-ui-pianificazione*
*Completed: 2026-01-28*
