# Requirements: Esercizi di Gruppo

**Milestone:** Helix — Esercizi di Gruppo
**Scoped:** 2026-01-28
**Status:** Active

## V1 Requirements

### Database

| ID | Requirement | Acceptance Criteria | Status |
|----|-------------|---------------------|--------|
| REQ-DB-001 | Flag `is_group` su session_exercises | Colonna boolean NOT NULL DEFAULT false sulla tabella session_exercises | Complete ✓ |
| REQ-DB-002 | Migration backward compatible | Sessioni esistenti continuano a funzionare con is_group=false | Complete ✓ |

### UI Pianificazione

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-PLAN-001 | Toggle "di gruppo" in SessionDetail | Switch visibile per ogni esercizio nella sessione |
| REQ-PLAN-002 | Indicatore visivo in lista esercizi | Badge/icon che mostra quali esercizi sono di gruppo |

### UI Live Tablet

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-LIVE-001 | Tab toggle "Individuali" / "Gruppo" | Toggle in alto nella pagina TabletLive |
| REQ-LIVE-002 | Vista individuale (default) | Comportamento attuale: esercizi del cliente selezionato |
| REQ-LIVE-003 | Vista gruppo | Lista esercizi is_group=true di TUTTI i clienti della giornata |
| REQ-LIVE-004 | Indicatore visivo gruppo | Icon/badge su ExerciseCard quando is_group=true |
| REQ-LIVE-005 | Lista partecipanti per esercizio | Mostra nomi clienti che hanno quell'esercizio di gruppo |
| REQ-LIVE-006 | Complete-for-all | Un tap su "completa" marca l'esercizio per tutti i partecipanti |
| REQ-LIVE-007 | Skip per singolo | Possibilità di saltare per un singolo cliente anche se di gruppo |

### MCP Server

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-MCP-001 | Lettura is_group in session resource | Campo is_group incluso in helix://sessions/{id} |
| REQ-MCP-002 | Scrittura is_group in add_session_exercise | Parametro opzionale is_group nel tool |
| REQ-MCP-003 | Scrittura is_group in update_session_exercise | Parametro opzionale is_group nel tool |
| REQ-MCP-004 | Lettura is_group in create_training_plan | Supporto is_group negli esercizi del piano |

## V2 Requirements (Post-MVP)

| ID | Feature | Rationale |
|----|---------|-----------|
| REQ-V2-001 | Timeline view | Visualizzazione orizzontale degli esercizi di gruppo nel tempo |
| REQ-V2-002 | Auto-detect group exercises | Sistema suggerisce raggruppamento quando stesso esercizio in più sessioni |
| REQ-V2-003 | Group notes/comments | Note condivise visibili a coach per contesto gruppo |
| REQ-V2-004 | Group exercise history | Storico sessioni di gruppo con stessi partecipanti |
| REQ-V2-005 | Participant count badge | Indicatore "3/4 presenti" per esercizi di gruppo |
| REQ-V2-006 | Bulk parameter adjustment | Modifica reps/peso per tutti i partecipanti insieme |
| REQ-V2-007 | Group exercise templates | Salva esercizi di gruppo frequenti come template |

## Out of Scope

| Feature | Rationale |
|---------|-----------|
| Class booking/scheduling | Helix è per coaching, non gym management |
| Client-facing group view | Gruppi sono strumento interno coach |
| Automatic session creation | Coach crea sessioni individuali, marca esercizi come gruppo |
| Group chat/communication | Coach comunica verbalmente in palestra |
| Attendance tracking system | Implicito: se cliente ha sessione, è presente |
| Capacity limits | Non necessario per PT use case |
| Recurring group schedules | Ogni sessione è standalone |
| Payment splitting | Billing fuori scope |
| Leaderboards/competition | Gamification distrae dal coaching |

## Dependency Map

```
REQ-DB-001 (foundation)
    │
    ├── REQ-PLAN-001 (toggle in planning)
    │       │
    │       └── REQ-PLAN-002 (visual indicator)
    │
    ├── REQ-LIVE-001 (tab toggle)
    │       │
    │       ├── REQ-LIVE-002 (individual view - existing)
    │       │
    │       └── REQ-LIVE-003 (group view)
    │               │
    │               ├── REQ-LIVE-004 (visual indicator)
    │               │
    │               ├── REQ-LIVE-005 (participant list)
    │               │
    │               ├── REQ-LIVE-006 (complete-for-all)
    │               │
    │               └── REQ-LIVE-007 (skip individual)
    │
    └── REQ-MCP-001..004 (MCP integration)
```

## Technical Notes

From research:
- Use PostgreSQL RPC with SECURITY INVOKER for atomic batch updates
- Enable Realtime on session_exercises for cross-tablet sync
- Optimistic updates with rollback on failure
- No new dependencies required

---
*Requirements scoped: 2026-01-28*
