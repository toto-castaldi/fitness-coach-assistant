# Phase 3: UI Pianificazione - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add toggle "di gruppo" to exercises in SessionDetail planning page. Coach can mark individual exercises as group exercises during session planning. Visual indicator shows which exercises are group exercises. This phase does NOT include the live tablet group view (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Toggle interaction
- Instant toggle — no confirmation required, fully reversible
- When adding new exercise: option to mark as "di gruppo" visible during add flow
- Toggle one exercise at a time (no bulk action)

### Visual indicator
- Keep original exercise order — group exercises stay where they were added
- Show count/summary of group exercises (e.g., "3 esercizi di gruppo")

### Group exercise behavior
- When duplicating session: preserve is_group status on all exercises
- AI (MCP create_training_plan) can suggest which exercises are group exercises
- No validation needed for group exercises in solo sessions — coach knows their schedule

### Claude's Discretion
- Toggle placement (inline on row vs in edit modal) — follow existing patterns
- Toggle label (icon+text vs icon-only) — balance space and clarity
- Indicator type (icon vs badge vs color) — match existing UI patterns
- Indicator prominence — balance visibility with UI cleanliness
- Summary placement and styling

</decisions>

<specifics>
## Specific Ideas

- MCP already supports is_group (Phase 2 complete) — UI should leverage this
- useSessions hook needs update to handle is_group in mutations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ui-pianificazione*
*Context gathered: 2026-01-28*
