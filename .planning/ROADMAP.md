# Roadmap: Esercizi di Gruppo

**Milestone:** Helix — Esercizi di Gruppo
**Created:** 2026-01-28
**Status:** Active

## Overview

4 fasi per implementare gli esercizi di gruppo mantenendo backward compatibility.

## Phases

### Phase 1: Database Schema
**Goal:** Aggiungere colonna is_group a session_exercises
**Requirements:** REQ-DB-001, REQ-DB-002
**Status:** Complete ✓
**Completed:** 2026-01-28
**Plans:** 1 plan

**Deliverables:**
- [x] Migration per aggiungere `is_group BOOLEAN NOT NULL DEFAULT false`
- [x] Verifica RLS policies esistenti funzionano
- [x] Test: sessioni esistenti non impattate

**Success Criteria:**
- Colonna is_group presente in session_exercises ✓
- Query esistenti continuano a funzionare ✓
- Default false per tutte le righe esistenti ✓

Plans:
- [x] 01-01-PLAN.md — Migration + TypeScript types + CLAUDE.md update

---

### Phase 2: MCP Server Integration
**Goal:** Esporre is_group in lettura e scrittura via MCP
**Requirements:** REQ-MCP-001, REQ-MCP-002, REQ-MCP-003, REQ-MCP-004
**Status:** Pending
**Depends on:** Phase 1

**Deliverables:**
- [ ] Resource helix://sessions/{id} include is_group negli esercizi
- [ ] Tool add_session_exercise accetta parametro is_group
- [ ] Tool update_session_exercise accetta parametro is_group
- [ ] Tool create_training_plan supporta is_group negli esercizi

**Success Criteria:**
- Claude può leggere is_group dalle sessioni
- Claude può creare esercizi con is_group=true
- Claude può modificare is_group su esercizi esistenti

---

### Phase 3: UI Pianificazione
**Goal:** Toggle "di gruppo" nella pagina SessionDetail
**Requirements:** REQ-PLAN-001, REQ-PLAN-002
**Status:** Pending
**Depends on:** Phase 1

**Deliverables:**
- [ ] Switch/toggle per is_group su ogni esercizio in SessionDetail
- [ ] Indicatore visivo (icon/badge) nella lista esercizi
- [ ] Hook useSessions aggiornato per gestire is_group

**Success Criteria:**
- Coach può marcare esercizio come "di gruppo" durante pianificazione
- Indicatore visivo chiaro per esercizi di gruppo
- Stato persistito correttamente in database

---

### Phase 4: UI Live Tablet
**Goal:** Vista gruppo con complete-for-all nel live coaching
**Requirements:** REQ-LIVE-001, REQ-LIVE-002, REQ-LIVE-003, REQ-LIVE-004, REQ-LIVE-005, REQ-LIVE-006, REQ-LIVE-007
**Status:** Pending
**Depends on:** Phase 1, Phase 3

**Deliverables:**
- [ ] Tab toggle "Individuali" / "Gruppo" in TabletLive
- [ ] Vista individuale: comportamento esistente
- [ ] Vista gruppo: lista esercizi is_group=true di tutti i clienti del giorno
- [ ] Indicatore visivo su ExerciseCard per esercizi di gruppo
- [ ] Lista partecipanti per ogni esercizio di gruppo
- [ ] Complete-for-all: un tap marca completo per tutti
- [ ] Skip individuale: possibilità di saltare per singolo cliente
- [ ] RPC function per update atomico cross-session
- [ ] Realtime subscription per sync cross-tablet

**Success Criteria:**
- Coach può switchare tra vista individuale e gruppo
- Vista gruppo mostra tutti gli esercizi di gruppo della giornata
- "Completa" su esercizio di gruppo aggiorna tutti i partecipanti
- Skip individuale non impatta altri partecipanti
- Sync real-time tra tablet (se più coach)

---

## Phase Dependencies

```
Phase 1 (DB Schema)
    │
    ├── Phase 2 (MCP Server) ─── can run in parallel with Phase 3
    │
    ├── Phase 3 (UI Planning)
    │       │
    │       └── Phase 4 (UI Live) ─── depends on both Phase 1 and Phase 3
```

## Estimated Effort

| Phase | Complexity | Files Impacted |
|-------|------------|----------------|
| Phase 1 | Low | 1 migration |
| Phase 2 | Low | 1 edge function |
| Phase 3 | Medium | 2-3 components, 1 hook |
| Phase 4 | High | 3-4 components, 1-2 hooks, 1 RPC |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition su complete-for-all | Data inconsistency | RPC function con transaction |
| Performance con molti clienti | Slow group view | Query ottimizzata con indici |
| Sync cross-tablet | Stato stale | Supabase Realtime subscription |

---
*Roadmap created: 2026-01-28*
