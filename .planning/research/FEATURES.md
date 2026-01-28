# Feature Landscape: Group Exercise Functionality

**Domain:** Fitness coach app - Group exercise management for live coaching
**Researched:** 2026-01-28
**Confidence:** MEDIUM (based on competitor analysis and industry patterns)

## Context

This research focuses on **group exercise features** for the Helix fitness coach app. The use case is specific:

- Coach plans individual sessions for each client
- Some exercises are marked as "group" (multiple clients do them simultaneously)
- During live coaching, coach can toggle between individual and group view
- Group exercises are completed once for all participants

This is **not** about class scheduling or gym management - it's about managing shared exercises within existing individual sessions during live coaching.

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Flag exercise as group** | Core functionality - must mark which exercises are shared | Low | Boolean flag on session_exercises table |
| **Toggle individual/group view** | Coach needs to switch contexts during live session | Low | Tab or toggle in UI |
| **Group exercise list for day** | See all group exercises scheduled for the day | Low | Filtered query of flagged exercises |
| **Complete once for all** | Marking group exercise done should update all participants | Medium | Cross-session update logic |
| **Visual indicator of group status** | Coach needs to know at a glance which exercises are shared | Low | Icon or badge on exercise cards |
| **Participant list per group exercise** | Coach needs to see who is doing this exercise together | Low | List clients with same exercise flagged as group |
| **Skip for individual within group** | One client may not do a group exercise (injury, etc.) | Medium | Per-client override of group completion |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Timeline view** | Visual timeline of group exercises throughout the day | Medium | Horizontal timeline showing when group exercises occur |
| **Auto-detect group exercises** | System suggests grouping when same exercise appears in multiple sessions for same time | Medium | Smart detection during planning |
| **Group notes/comments** | Shared notes visible to coach for group context | Low | Text field on group exercise |
| **Group exercise history** | See past group sessions with same participants | Medium | Query pattern for historical data |
| **Participant count badge** | "3/4 present" indicator for group exercises | Low | Quick status view |
| **Bulk parameter adjustment** | Change reps/weight for all participants at once | Medium | Batch update across sessions |
| **Group exercise templates** | Save common group exercises for reuse | Medium | Template system for frequent groups |

## Anti-Features

Features to explicitly NOT build in v1. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Class booking/scheduling** | Out of scope - Helix is about coaching, not gym management. Adding booking adds massive complexity (payments, waitlists, cancellations) | Keep individual session model. Coach plans sessions, marks exercises as group. |
| **Client-facing group view** | Clients don't need to know about groups - this is coach workflow optimization | Groups are internal coach tool only |
| **Automatic session creation** | "Create group session" that generates sessions for all clients is complex and error-prone | Coach creates individual sessions as before, just flags exercises as group |
| **Group chat/communication** | Social features bloat the app, not needed for live coaching | Coach communicates verbally in gym |
| **Attendance tracking system** | Formal check-in/check-out adds friction for small group coaching | Implicit - if client has session, they're "attending" |
| **Capacity limits** | Group size limits add complexity without value for PT use case | No limits - coach manages manually |
| **Recurring group schedules** | Complex scheduling logic for something coach can handle manually | Each session is standalone |
| **Waitlist management** | Gym class feature, not PT feature | Not applicable to coaching model |
| **Payment splitting** | Billing is out of scope for Helix | External to app |
| **Leaderboards/competition** | Gamification distracts from coaching focus | Keep it simple, professional |

## Feature Dependencies

```
Flag exercise as group (foundation)
    |
    +-- Toggle individual/group view
    |
    +-- Group exercise list for day
    |       |
    |       +-- Timeline view (enhancement)
    |
    +-- Complete once for all
    |       |
    |       +-- Skip for individual within group
    |       |
    |       +-- Bulk parameter adjustment (enhancement)
    |
    +-- Visual indicator of group status
            |
            +-- Participant list per group exercise
                    |
                    +-- Participant count badge (enhancement)
```

## MVP Recommendation

For MVP, prioritize these table stakes:

1. **Flag exercise as group** - Database and UI to mark exercises
2. **Toggle individual/group view** - Tab in live coaching view
3. **Group exercise list for day** - List view in group tab
4. **Complete once for all** - Core workflow optimization
5. **Visual indicator of group status** - Icon on exercise cards
6. **Participant list per group exercise** - See who's in the group

Defer to post-MVP:

- **Timeline view**: Nice visual, not essential for function
- **Auto-detect group exercises**: Smart feature, but MVP can rely on manual flagging
- **Bulk parameter adjustment**: Coach can adjust individually for now
- **Group exercise templates**: Only needed after pattern emerges from usage
- **Skip for individual within group**: Edge case, can work around in v1

## Implementation Notes

### Existing Helix Context

Based on analysis of current Helix codebase:

- **Session model**: Sessions are per-client, linked to `session_exercises`
- **Live coaching**: Already supports multi-client view with `ClientStripBar` and `ExerciseCarousel`
- **Current flow**: Coach selects date, sees all clients with sessions that day, swipes between them

### Proposed Group Model

The simplest approach that fits existing architecture:

1. Add `is_group: boolean` flag to `session_exercises` table
2. Add `group_id: uuid` to link exercises across sessions (nullable, only set when is_group=true)
3. Group view filters to show only exercises where is_group=true
4. "Complete" on group exercise updates all session_exercises with same group_id

This **preserves** the individual session model while **adding** group functionality as a lens.

### Key Workflow

```
PLANNING (before gym)
1. Coach creates session for Client A with exercises [Squat, Bench, Row]
2. Coach creates session for Client B with exercises [Squat, Deadlift]
3. Coach marks Squat as "group" in both sessions (creates shared group_id)

LIVE COACHING (in gym)
1. Coach starts live session, sees individual view by default
2. Coach switches to group view
3. Sees: "Squat (A+B)" in timeline
4. Taps "complete" on Squat
5. Both Client A and Client B sessions mark Squat as completed
6. Coach switches back to individual view to continue
```

## Competitive Landscape

Based on research, most fitness software falls into two categories:

1. **Gym management software** (Mindbody, Glofox, Walla): Class booking, capacity, payments - NOT relevant to Helix use case

2. **Personal training software** (TrueCoach, Hevy Coach, TrainHeroic): Individual client management, some support "groups" as shared programming, but not live group completion

**Gap identified**: No solution optimally handles the PT scenario where:
- Multiple clients train simultaneously
- Some exercises are shared (warm-up, group drills)
- Coach needs one-tap completion for shared exercises
- Individual sessions remain the source of truth

This is Helix's opportunity - the "group exercise" feature within individual sessions is underserved.

## Sources

**Competitor Analysis (MEDIUM confidence):**
- [Hevy Coach](https://hevycoach.com/) - Client tracking, program assignment
- [TrueCoach](https://truecoach.co/) - Exercise compliance tracking
- [TeamBuildr](https://www.teambuildr.com/) - Team/group training focus
- [Everfit](https://everfit.io/) - Group coaching at scale
- [My PT Hub](https://www.mypthub.net/) - Group messaging, class booking

**Industry Patterns (MEDIUM confidence):**
- [Smart Health Clubs - Gym Scheduling Software 2026](https://smarthealthclubs.com/blog/the-7-best-gym-scheduling-software/)
- [Exercise.com - Fitness Class Scheduling Software 2026](https://www.exercise.com/grow/best-fitness-class-scheduling-software/)
- [PT Pioneer - Personal Training vs Group Classes](https://www.ptpioneer.com/personal-training/personal-training-vs-group-classes/)

**Group Training Concepts (MEDIUM confidence):**
- [Alloy - Advantages of Small Group Training](https://alloyfranchise.com/blog/advantages-of-small-group-training/)
- [ISSA - Small Group Training Benefits](https://www.issaonline.com/blog/post/why-your-training-business-needs-small-group-fitness)
- [AFAA - Group Fitness vs Group Personal Training](https://blog.afaa.com/group-fitness-versus-group-personal-training-are-we-really-so-different)

---

## Quality Checklist

- [x] Categories are clear (table stakes vs differentiators vs anti-features)
- [x] Features are specific to group exercise management
- [x] Complexity noted for each feature
- [x] Dependencies mapped
- [x] MVP recommendation provided
- [x] Anti-features explicitly listed with rationale
- [x] Aligned with existing Helix architecture
