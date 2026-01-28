# Project Milestones: Helix

## v1.0 Esercizi di Gruppo (Shipped: 2026-01-28)

**Delivered:** Group exercise support for live coaching — coaches can mark exercises as "group", view all group exercises across clients, and complete them for all participants with one tap.

**Phases completed:** 1-4 (6 plans total)

**Key accomplishments:**
- Database schema extended with `is_group` column and partial index for efficient filtering
- MCP server updated to expose group exercises (Claude can plan group workouts)
- Planning UI with "Di gruppo" toggle and visual badge indicators
- Live tablet group view with complete-for-all and skip-per-participant
- RPC functions for atomic cross-session updates with realtime sync
- Full backward compatibility — existing sessions unchanged

**Stats:**
- 49 files modified
- ~7,000 lines added (TypeScript/SQL)
- 4 phases, 6 plans
- 39 days from start to ship

**Git range:** `feat(01-01)` → `feat(04-03)`

**What's next:** TBD — next milestone goals

---
