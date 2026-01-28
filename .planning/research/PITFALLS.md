# Domain Pitfalls: Group Exercise Functionality

**Domain:** Group exercise / shared workout features for fitness coaching app
**Researched:** 2026-01-28
**Confidence:** HIGH (based on existing codebase analysis + domain research)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

---

### Pitfall 1: Race Conditions on Concurrent Exercise Updates

**What goes wrong:** Multiple tablets update the same `session_exercises` row simultaneously. Coach A marks exercise complete while Coach B modifies reps. Database receives both updates, last one wins, losing data.

**Why it happens:** Current `useLiveCoaching` hook uses optimistic updates without any locking mechanism. When the same exercise appears in a group view across multiple client sessions, a "complete for all" action fires multiple concurrent Supabase updates.

**Consequences:**
- Lost exercise completion timestamps
- Incorrect parameter values (sets/reps/weight)
- Inconsistent state between tablets
- Coach confusion when UI shows different states

**Prevention:**
1. **Use optimistic locking with version column:** Add `version` column to `session_exercises`. Include `WHERE version = $currentVersion` in updates. Increment version on each update.
   ```sql
   ALTER TABLE session_exercises ADD COLUMN version integer NOT NULL DEFAULT 0;
   ```
2. **Batch group updates in single transaction:** When "complete for all" is triggered, use a Supabase Edge Function to perform all updates atomically.
3. **Enable Supabase Realtime on session_exercises:** Subscribe to changes so all tablets see consistent state after any update.

**Detection:**
- Test with two browser tabs updating same exercise simultaneously
- Check if `completed_at` timestamps vary unexpectedly
- Monitor for Supabase update conflicts in logs

**Phase to address:** Database Migration phase (add version column) + Group View implementation phase

---

### Pitfall 2: Aggregation Logic Divergence

**What goes wrong:** When same exercise appears across multiple client sessions with different parameters (e.g., Client A: 3x12 @ 10kg, Client B: 3x10 @ 8kg), the group view shows confusing or incorrect information.

**Why it happens:** Naive aggregation assumes exercises are identical. Real-world coaching has individualized parameters per client.

**Consequences:**
- UI shows wrong parameters in group view
- Coach loses track of individual client needs
- "Complete for all" applies wrong values to some clients
- Data integrity issues when parameters don't match

**Prevention:**
1. **Display parameter variance explicitly:** Show "3x12 (varies)" or expand to show per-client breakdown when parameters differ.
2. **Flag parameter conflicts:** Add visual indicator when same exercise has different parameters across sessions.
3. **"Complete for all" preserves individual parameters:** Only mark completion status, don't overwrite per-client parameters.
4. **Consider "sync parameters" as explicit action:** Let coach deliberately synchronize parameters rather than assuming they should match.

**Detection:**
- Create test data with same exercise, different parameters across clients
- Verify group view displays correct information
- Confirm "complete for all" doesn't corrupt individual parameter values

**Phase to address:** Group View UI implementation phase

---

### Pitfall 3: Completed Session State Confusion

**What goes wrong:** Some clients' sessions are already `status: 'completed'` while others are `status: 'planned'`. Group view shows exercises from completed sessions that shouldn't be modified.

**Why it happens:** Coach may have already finished with one client, or client session was auto-completed (all exercises done). Group aggregation doesn't distinguish completed vs planned sessions.

**Consequences:**
- Coach accidentally modifies completed session data
- Audit trail becomes unreliable (completed sessions should be immutable)
- UI shows stale/irrelevant exercises in active group view
- Historical data gets corrupted

**Prevention:**
1. **Exclude completed sessions from group view by default:** Filter query to `WHERE status = 'planned'`.
2. **Visual differentiation:** If showing all sessions, clearly mark completed ones as read-only with distinct styling.
3. **Block mutations on completed sessions:** "Complete for all" should skip sessions with `status: 'completed'`.
4. **Require explicit "replan" action:** Current `replanSession` function exists - make it the only way to re-enable editing.

**Detection:**
- Create test scenario with mixed session states
- Verify UI prevents accidental edits to completed sessions
- Test "complete for all" with pre-completed sessions in the group

**Phase to address:** Group View query/filter phase

---

### Pitfall 4: Mid-Session Exercise Modifications Causing Inconsistency

**What goes wrong:** Coach adds/removes/reorders exercise on one client's session while group view is active. Group view doesn't reflect the change, or worse, applies changes intended for individual to entire group.

**Why it happens:** `addExerciseToSession`, `deleteExerciseFromSession` operate on individual session. Group view may cache exercise list or not subscribe to changes. User expects group action but performs individual action.

**Consequences:**
- Group view shows stale data
- Coach confusion about which clients have which exercises
- Order indices get out of sync
- "Complete for all" targets wrong exercise

**Prevention:**
1. **Clearly separate "individual" vs "group" actions in UI:** Different buttons, different visual zones, confirmation dialogs for group actions.
2. **Subscribe to Realtime for exercise list changes:** Not just completion status, but full exercise list with order.
3. **Re-aggregate on any change:** When any session_exercise changes, recalculate group view.
4. **Add `is_group` flag semantics:** An exercise marked as group exercise should only be modifiable via group actions, with clear UI indication.

**Detection:**
- Add exercise to one session while group view is open
- Delete exercise from one session while group view active
- Verify group view updates or clearly indicates stale state

**Phase to address:** Group View real-time subscription phase

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

---

### Pitfall 5: `is_group` Flag Semantic Ambiguity

**What goes wrong:** Flag `is_group: true` on `session_exercises` is added but its meaning is unclear. Does it mean "show in group view"? "Can only be modified as group"? "Was created via group action"?

**Why it happens:** Flag added without clear specification of all use cases and edge cases.

**Consequences:**
- Different code paths interpret flag differently
- UI behaves inconsistently
- Flag becomes meaningless over time
- Technical debt accumulates

**Prevention:**
1. **Document exact semantics before implementation:**
   - `is_group = true`: This exercise appears in group view aggregation
   - `is_group = false`: Individual exercise, excluded from group view
2. **Consider additional fields if needed:**
   - `group_exercise_id`: Links to a canonical "template" exercise for the group
   - `created_via_group`: Audit flag for how exercise was added
3. **Test all permutations:**
   - Add as group -> modify individually: allowed?
   - Add as individual -> add to group view: allowed?
   - Remove from group view: what happens to flag?

**Detection:**
- Write test cases covering all combinations
- Review all code paths that read/write `is_group`

**Phase to address:** Schema Design phase (before migration)

---

### Pitfall 6: Order Index Conflicts in Group View

**What goes wrong:** Each client's session has `order_index` for exercises. Group view shows all clients' exercises in one carousel. Current exercise pointer (`current_exercise_index`) per session conflicts with group-wide "current" concept.

**Why it happens:** Current data model is session-centric, not group-centric. `current_exercise_index` on `sessions` table assumes one client at a time.

**Consequences:**
- Unclear which exercise is "current" in group view
- Navigation (next/previous) behaves unexpectedly
- Complete/skip actions affect wrong exercises

**Prevention:**
1. **Group view uses exercise type as aggregation key, not index:** Group by `exercise_id`, not `order_index`.
2. **Maintain separate group navigation state:** In-memory group pointer separate from per-session `current_exercise_index`.
3. **Update all sessions' indices together for group navigation:** When coach advances group, update all sessions' `current_exercise_index` in batch.

**Detection:**
- Sessions with same exercises in different order
- Navigate in group view, verify per-session state updates correctly

**Phase to address:** Group View state management phase

---

### Pitfall 7: No Realtime Subscription on session_exercises

**What goes wrong:** Currently only `lumio_repositories` has Realtime enabled. Changes to exercises don't propagate to other tablets.

**Why it happens:** Realtime was added for Docora webhook integration, not live coaching sync.

**Consequences:**
- Tablets show stale exercise data
- No conflict awareness
- Coach must manually refresh
- "Already completed" errors when UI shows incomplete

**Prevention:**
1. **Enable Realtime on session_exercises:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE session_exercises;
   ALTER TABLE session_exercises REPLICA IDENTITY FULL;
   ```
2. **Subscribe in useLiveCoaching hook:** Watch for INSERT, UPDATE, DELETE events.
3. **Merge realtime updates with optimistic state:** Handle race between optimistic update and realtime confirmation.

**Detection:**
- Open same session on two tablets
- Modify on tablet A, verify tablet B updates

**Phase to address:** Real-time sync implementation phase

---

### Pitfall 8: Performance Degradation with Many Sessions

**What goes wrong:** Group view queries all sessions for a date, then aggregates. With 10+ clients, each with 15+ exercises, query becomes slow and UI sluggish.

**Why it happens:** Current query fetches full session_exercises with nested exercise details. No pagination, no lazy loading.

**Consequences:**
- Slow initial load
- UI freezes on updates
- Poor tablet performance
- Coach frustration

**Prevention:**
1. **Aggregate at database level:** Create view or function that returns pre-aggregated group exercise data.
2. **Index on exercise_id + session_date:** Speed up group aggregation queries.
3. **Limit detail fetch to current/visible exercises:** Lazy load full exercise details.
4. **Cache exercise catalog:** Don't re-fetch exercise definitions on every query.

**Detection:**
- Performance test with 15 sessions, 20 exercises each
- Monitor query time and UI responsiveness
- Profile with React DevTools

**Phase to address:** Performance optimization phase (after MVP)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

---

### Pitfall 9: Unclear UI Feedback for Group Actions

**What goes wrong:** Coach clicks "complete for all" but unclear if action succeeded for all clients or just some.

**Why it happens:** Current SaveIndicator shows single status. Group actions have multiple outcomes.

**Prevention:**
1. **Show per-client feedback:** "Completed: 4/5 clients" with option to see failures.
2. **Distinct group action indicator:** Different visual treatment for group vs individual actions.

**Phase to address:** UI polish phase

---

### Pitfall 10: Missing Undo for Group Actions

**What goes wrong:** Coach accidentally completes exercise for all clients. No easy way to reverse except manually uncompleting each.

**Why it happens:** Current system has no undo mechanism.

**Prevention:**
1. **Add "undo last group action" feature:** Store last action for quick reversal.
2. **Confirmation dialog for destructive group actions:** "Complete for all 6 clients?"

**Phase to address:** UX improvement phase

---

### Pitfall 11: Tablet Offline Handling

**What goes wrong:** Tablet loses connectivity mid-session. Optimistic updates accumulate. When reconnecting, conflicts arise with changes from other tablets.

**Why it happens:** Current implementation assumes always-online.

**Prevention:**
1. **Queue offline changes:** Store pending updates locally.
2. **Conflict resolution on reconnect:** Last-write-wins or prompt coach.
3. **Visual offline indicator:** Coach knows when changes aren't syncing.

**Phase to address:** Offline support phase (post-MVP)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema Design | `is_group` flag ambiguity (#5) | Document exact semantics in migration comments |
| Database Migration | Version column breaks existing queries (#1) | Update all session_exercises queries to handle version |
| Group View Query | Completed session inclusion (#3) | Add explicit `status = 'planned'` filter, test with mixed states |
| Group View UI | Parameter variance confusion (#2) | Design for divergence, show "varies" indicator |
| "Complete for All" | Race conditions (#1) | Use Edge Function for atomic batch update |
| Realtime Subscription | No subscription exists (#7) | Add migration to enable Realtime |
| State Management | Order index conflicts (#6) | Separate group pointer from session pointer |
| Performance | Query slowness (#8) | Monitor query time, add indices early |

---

## Edge Cases Checklist

Test these specific scenarios before shipping:

- [ ] Two tablets update same exercise simultaneously
- [ ] Same exercise, different parameters across 3 clients
- [ ] One session completed, two sessions planned, same exercises
- [ ] Add exercise to individual session while group view open
- [ ] Delete exercise from individual session while group view open
- [ ] Network disconnection during "complete for all"
- [ ] 10+ sessions on same date
- [ ] Empty session in group (no exercises)
- [ ] All sessions already completed for the date
- [ ] Session with only one exercise (edge for delete prevention)
- [ ] Different exercise order across sessions (same exercises, different sequence)

---

## Sources

**Confidence Level Key:**
- HIGH: Verified via codebase analysis or authoritative documentation
- MEDIUM: Multiple sources agree or verified with official docs
- LOW: Single source, needs validation

### HIGH Confidence Sources
- Existing Helix codebase analysis (migrations, hooks, components)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)

### MEDIUM Confidence Sources
- [Bootstrapped Supabase: Concurrent Writes Guide](https://bootstrapped.app/guide/how-to-handle-concurrent-writes-in-supabase)
- [Optimistic Locking in PostgreSQL](https://reintech.io/blog/implementing-optimistic-locking-postgresql)
- [Race Conditions in Software](https://www.akamai.com/glossary/what-is-a-race-condition)
- [Bulk Editing Design Patterns](https://design.basis.com/patterns/bulk-editing)
- [Bulk Action UX Guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [Collaborative Editing Challenges](https://medium.com/@mehulgala77/concurrent-collaborative-editing-d10192e55d2e)

### LOW Confidence Sources (needs validation)
- General fitness app UX patterns from various design case studies
