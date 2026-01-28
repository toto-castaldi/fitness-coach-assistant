# Project Research Summary

**Project:** Helix - Group Exercise Functionality
**Domain:** Fitness coaching app - shared exercise management
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

Adding group exercise functionality to Helix requires no new technology stack. The feature allows coaches to mark exercises as "group" across multiple individual client sessions and complete them with a single action during live coaching. Research confirms that the existing React 19 + Supabase architecture fully supports this pattern with minimal additions: a boolean flag on the database, an RPC function for atomic batch updates, and a tab toggle in the UI.

The recommended approach preserves Helix's individual-session-per-client model while adding group functionality as a filtered view. This avoids the complexity of class scheduling, gym management, or social features common in fitness software but inappropriate for personal training use cases. The core technical pattern is straightforward: flag exercises as group, aggregate by exercise ID in a separate view, and use PostgreSQL RPC with SECURITY INVOKER for atomic cross-session updates that respect existing Row Level Security policies.

The main risk is race conditions when multiple tablets modify the same exercises concurrently. This is mitigated by using optimistic updates with Supabase Realtime subscriptions, batching all group updates in a single transactional RPC call, and potentially adding version-based optimistic locking if conflicts emerge. Secondary risks include unclear UI semantics when exercises have different parameters across clients, and performance degradation with many concurrent sessions. Both are addressable through careful UI design and database indexing.

## Key Findings

### Recommended Stack

No changes to the existing stack are needed. Helix already has all required technologies:

**Core technologies:**
- **React 19**: Frontend framework — already handles optimistic updates in useLiveCoaching hook
- **TypeScript 5.x**: Type safety — existing types extend trivially for `is_group` flag
- **Supabase (PostgreSQL + Realtime)**: Backend — native batch updates via `.in()`, RPC for transactions, Realtime for cross-tablet sync
- **Tailwind CSS + shadcn/ui**: Styling — Tabs component ready for individual/group toggle
- **Supabase Edge Functions**: Not required but available if complex logic emerges

**Database pattern:**
- Boolean `is_group` flag on `session_exercises` table (simplest approach, no new tables)
- PostgreSQL RPC function for batch completion (single query updates all matching exercises)
- Realtime subscription to `session_exercises` for live updates across tablets

### Expected Features

Research identifies clear feature tiers for launch prioritization:

**Must have (table stakes):**
- Flag exercise as group — core functionality, boolean flag on session_exercises
- Toggle individual/group view — tab or toggle in live coaching UI
- Group exercise list for day — filtered query of flagged exercises
- Complete once for all — cross-session batch update via RPC
- Visual indicator of group status — icon/badge on exercise cards
- Participant list per group exercise — see which clients share the exercise

**Should have (competitive):**
- Participant count badge — "3/4 present" quick status view
- Group notes/comments — shared context visible to coach
- Timeline view — visual schedule of group exercises throughout day

**Defer (v2+):**
- Auto-detect group exercises — smart suggestions when same exercise appears across sessions
- Bulk parameter adjustment — change reps/weight for all participants at once
- Group exercise templates — save common groups for reuse
- Skip for individual within group — per-client override of group completion

**Anti-features (explicitly avoid):**
- Class booking/scheduling — out of scope, adds massive complexity (payments, waitlists)
- Client-facing group view — clients don't need to know about groups, this is coach workflow optimization
- Automatic session creation — "create group session" that generates sessions for all clients is error-prone
- Attendance tracking, capacity limits, recurring schedules — gym management features inappropriate for PT workflow

### Architecture Approach

The recommended architecture uses PostgreSQL RPC functions with SECURITY INVOKER for atomic group exercise updates. This pattern runs in a single transaction, respects existing RLS policies, and triggers realtime events for all updated rows. The frontend hook applies optimistic updates before calling RPC and subscribes to realtime for cross-tablet synchronization.

**Major components:**
1. **TabletLive UI** — adds tab toggle for individual/group mode, reuses existing ExerciseCarousel component with grouped data
2. **useLiveCoaching hook** — extends with `completeGroupExercise()` method, manages optimistic updates + realtime sync
3. **PostgreSQL RPC function** — `complete_group_exercise(session_exercise_id, session_date, exercise_id)` performs atomic batch update
4. **Supabase Realtime** — broadcasts `postgres_changes` events on `session_exercises` table to all subscribed tablets

**Key patterns:**
- **RPC over client-side loops** — ensures atomicity, single round-trip, prevents partial updates
- **SECURITY INVOKER over DEFINER** — respects existing RLS without custom authorization logic
- **Optimistic updates + Realtime** — instant UI feedback, eventual consistency across devices
- **Table-level subscriptions** — simpler than broadcast channels, sufficient for single-coach scale

### Critical Pitfalls

1. **Race Conditions on Concurrent Updates** — Multiple tablets updating same exercises simultaneously causes data loss. **Mitigation:** Use PostgreSQL RPC for atomic batch updates, enable Realtime on session_exercises for consistent state, consider adding version column for optimistic locking if conflicts emerge.

2. **Aggregation Logic Divergence** — Same exercise with different parameters across clients (e.g., Client A: 10kg, Client B: 8kg) causes confusing UI. **Mitigation:** Display parameter variance explicitly ("3x12 varies"), show per-client breakdown when parameters differ, "complete for all" only marks completion status without overwriting individual parameters.

3. **Completed Session State Confusion** — Group view includes exercises from already-completed sessions, allowing accidental modifications to historical data. **Mitigation:** Filter group view to `status = 'planned'` by default, block mutations on completed sessions, require explicit "replan" action to re-enable editing.

4. **Mid-Session Exercise Modifications** — Coach adds/removes exercise on individual session while group view active, causing stale data. **Mitigation:** Subscribe to Realtime for full exercise list changes (not just completion), re-aggregate on any change, clearly separate individual vs group actions in UI.

5. **`is_group` Flag Semantic Ambiguity** — Unclear meaning leads to inconsistent code paths. **Mitigation:** Document exact semantics before implementation ("exercise appears in group aggregation"), test all permutations of flag transitions.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundational changes before UI features:

### Phase 1: Database Schema & RPC Functions
**Rationale:** Non-destructive schema change must come first. Adding `is_group` flag is additive (no data loss risk), and RPC functions define the group completion contract that UI will depend on. This follows project rules: "SQL migrations must never cause data loss."

**Delivers:**
- Migration adding `is_group BOOLEAN DEFAULT false` to session_exercises
- Index on `is_group` for query performance
- `complete_group_exercise()` RPC function with SECURITY INVOKER
- `skip_group_exercise()` RPC function for symmetry
- Realtime enabled on session_exercises table
- Updated TypeScript types for SessionExercise interface

**Addresses:** Foundation for all group features, prevents race conditions (Pitfall 1)

**Avoids:** Semantic ambiguity (Pitfall 5) by documenting flag meaning in migration comments

### Phase 2: Hook Extensions & Realtime Sync
**Rationale:** State management layer must be solid before UI relies on it. Extending useLiveCoaching hook with group methods establishes the contract for optimistic updates, RPC calls, and realtime reconciliation. This phase addresses the core concurrency concerns.

**Delivers:**
- `completeGroupExercise()` method in useLiveCoaching
- `skipGroupExercise()` method
- Optimistic update logic for group actions
- Realtime subscription to session_exercises changes
- Error handling and rollback for failed group operations

**Uses:** Supabase RPC pattern, SECURITY INVOKER functions from Phase 1

**Implements:** Optimistic updates + Realtime pattern (Architecture component 2)

**Addresses:** Race conditions (Pitfall 1), real-time sync (Pitfall 7)

### Phase 3: Group View UI & Tab Toggle
**Rationale:** With database and state management stable, UI can safely consume group data. Tab toggle provides coach with clear mode switching. This phase focuses on visual clarity and workflow.

**Delivers:**
- Tab toggle component (Individual | Gruppo) using shadcn/ui Tabs
- Group exercise list view showing aggregated exercises
- Visual indicator (icon/badge) on group exercise cards
- Participant list display for each group exercise
- Filtering logic to show only group exercises in group mode

**Addresses:** Toggle individual/group view, group exercise list, visual indicators (table stakes)

**Avoids:** Parameter divergence confusion (Pitfall 2) by showing "varies" indicator when parameters differ

### Phase 4: Session Planning Integration
**Rationale:** Coaches need to flag exercises as group during session creation, not just during live coaching. This phase integrates group functionality into the planning workflow.

**Delivers:**
- "Mark as group" toggle in exercise selection UI
- Bulk flag operation (mark multiple exercises as group at once)
- Visual indication in session plan view
- Warning when flagging exercises with divergent parameters

**Addresses:** Flag exercise as group (table stakes), workflow integration

**Avoids:** Completed session confusion (Pitfall 3) by preventing group flag on completed sessions

### Phase 5: Polish & Edge Cases
**Rationale:** After core functionality works, address edge cases and UX refinements identified in research.

**Delivers:**
- Per-client feedback for group actions ("Completed: 4/5 clients")
- Confirmation dialog for destructive group actions
- Participant count badge in timeline
- Group exercise filtering by completed/planned status
- Performance monitoring for query optimization

**Addresses:** UI feedback (Pitfall 9), performance concerns (Pitfall 8)

**Avoids:** Order index conflicts (Pitfall 6) through careful state management testing

### Phase Ordering Rationale

- **Database first** prevents code from depending on missing schema, follows project migration rules
- **Hook before UI** ensures state management is stable and testable independently
- **Core UI before polish** delivers MVP functionality quickly, defers enhancements
- **Planning integration after live coaching** validates pattern with real usage before extending to more surfaces
- **Dependencies flow down:** Each phase uses artifacts from previous phases (RPC functions → hook methods → UI components)

**Critical path:** Phase 1 → Phase 2 → Phase 3 is the minimum viable feature. Phases 4-5 are enhancements.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Session Planning Integration):** May need research on bulk operation UX patterns if flagging many exercises at once becomes cumbersome. Current research focused on live coaching, not planning workflow.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Database Schema):** Straightforward migration, well-documented Supabase patterns
- **Phase 2 (Hook Extensions):** Extends existing useLiveCoaching pattern, no new concepts
- **Phase 3 (Group View UI):** Standard React component work, shadcn/ui Tabs already used in codebase
- **Phase 5 (Polish):** Incremental improvements, no architectural decisions

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All required technologies already in use. Supabase RPC, Realtime, and React patterns verified in official docs. |
| Features | MEDIUM | Competitor analysis shows gap in market for this workflow. Feature list derived from domain logic, but some prioritization based on inference rather than direct user research. |
| Architecture | HIGH | PostgreSQL RPC + SECURITY INVOKER pattern verified in Supabase documentation. Existing codebase analysis confirms compatibility. |
| Pitfalls | HIGH | Race conditions, RLS, and concurrency patterns well-documented in PostgreSQL and Supabase resources. Edge cases derived from existing codebase structure. |

**Overall confidence:** HIGH

Research is comprehensive across stack, features, architecture, and risks. Primary uncertainty is feature prioritization (what coaches need most), which can be validated during implementation.

### Gaps to Address

- **Parameter synchronization strategy:** Research identified that exercises may have different parameters across clients, but didn't specify detailed UX for how coaches reconcile this. Should be validated with user testing during Phase 3.

- **Multi-coach concurrency:** Current research assumes single coach. If multi-coach support is added later, realtime subscription patterns may need refinement to handle higher event volume. Monitor performance in Phase 5.

- **Offline handling:** Research flagged tablet connectivity loss as a concern but didn't specify full offline sync strategy. If this becomes critical, may need additional research on Supabase offline capabilities and conflict resolution patterns.

- **Group exercise history:** How coaches review past group sessions not fully specified. May need additional research on historical aggregation queries if this becomes a requested feature.

## Sources

### Primary (HIGH confidence)
- [Supabase JavaScript RPC Reference](https://supabase.com/docs/reference/javascript/rpc) — RPC function calls, array parameters
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — Performance, filtering, subscription patterns
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — SECURITY INVOKER vs DEFINER
- [PostgreSQL MVCC](https://www.postgresql.org/docs/current/mvcc.html) — Concurrency control fundamentals
- Helix codebase analysis — Existing useLiveCoaching hook, TabletLive component, migration patterns

### Secondary (MEDIUM confidence)
- [Bootstrapped Supabase: Concurrent Writes](https://bootstrapped.app/guide/how-to-handle-concurrent-writes-in-supabase) — Version-based optimistic locking
- [Fitness App Database Patterns](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application) — Entity relationships
- [Bulk Action UX Guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux) — UI patterns for multi-item operations
- Competitor analysis — Hevy Coach, TrueCoach, TeamBuildr (features, not implementation)

### Tertiary (LOW confidence)
- Various fitness app UX case studies — General patterns, needs validation against actual coach workflows

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
