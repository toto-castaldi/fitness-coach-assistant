# Helix — Esercizi di Gruppo

## What This Is

Helix è un'app web per fitness coach che gestisce clienti, sessioni di allenamento e esercizi. Include una PWA tablet per il live coaching in palestra e un server MCP per pianificazione AI via Claude. La milestone "Esercizi di Gruppo" ha aggiunto il supporto per esercizi condivisi tra più clienti durante le lezioni di gruppo.

## Core Value

Durante le lezioni di gruppo, il coach può gestire gli esercizi condivisi da un'unica vista, completandoli una volta per tutti i partecipanti.

## Requirements

### Validated

- ✓ Gestione clienti (anagrafica, obiettivi, storico) — existing
- ✓ Catalogo esercizi con tag e carte Lumio — existing
- ✓ Pianificazione sessioni con esercizi — existing
- ✓ Live coaching tablet (carousel esercizi, completamento, skip) — existing
- ✓ Sincronizzazione real-time — existing
- ✓ MCP server per integrazione AI (resources, tools, prompts) — existing
- ✓ Autenticazione Google OAuth — existing
- ✓ Gestione palestre — existing
- ✓ Repository Lumio con sync Docora — existing
- ✓ Flag `is_group` su session_exercises (database) — v1.0
- ✓ UI pianificazione: toggle "di gruppo" su esercizi in sessione — v1.0
- ✓ Live tablet: tab toggle "Individuali" | "Gruppo" — v1.0
- ✓ Live tablet: vista gruppo con esercizi del giorno — v1.0
- ✓ Live tablet: completamento di gruppo (un tap → tutti i clienti) — v1.0
- ✓ MCP: lettura/scrittura campo is_group negli esercizi sessione — v1.0

### Active

(Next milestone requirements will be defined via `/gsd:new-milestone`)

### Out of Scope

- Tracciamento esplicito dei partecipanti per esercizio — non necessario, ogni cliente ha la sua sessione
- Orario pianificato per esercizi — l'ordine basta, usa order_index
- Statistiche aggregate per esercizi di gruppo — può essere v2
- Notifiche ai clienti per esercizi di gruppo — non richiesto
- Class booking/scheduling — Helix è per coaching, non gym management
- Client-facing group view — gruppi sono strumento interno coach

## Context

**Shipped v1.0 Esercizi di Gruppo** with:
- 49 files modified, ~7,000 lines added
- 4 phases, 6 plans completed
- Tech stack unchanged: React 19 + Vite + TypeScript + Supabase

**Current codebase:**
- ~18,000 LOC TypeScript
- Two entry points: main app + live tablet PWA
- MCP server in Edge Function `helix-mcp`
- Realtime enabled on `session_exercises` for cross-tablet sync

**Key additions:**
- `is_group` column in `session_exercises` with partial index
- RPC functions: `complete_group_exercise`, `skip_group_exercise_for_client`
- Components: `GroupExerciseView`, `GroupExerciseCard`

## Constraints

- **Tech stack**: Supabase + React esistente — nessuna nuova dipendenza
- **Schema**: Aggiungere colonne, non ristrutturare tabelle
- **Backward compatible**: Sessioni esistenti devono funzionare
- **RLS**: Mantenere isolamento per coach (user_id)
- **Mobile-first**: UI tablet deve funzionare bene con touch

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Flag booleano `is_group` invece di relazione | Semplice, ogni sessione è indipendente | ✓ Good — works well, minimal complexity |
| Tab toggle invece di filtro | Più chiaro per il coach, due modalità di lavoro distinte | ✓ Good — clean UX separation |
| Completamento automatico per tutti | Efficienza durante la lezione, un tap basta | ✓ Good — with undo toast for safety |
| Ordine da order_index | Riusa campo esistente, no schema aggiuntivo | ✓ Good — no changes needed |
| Partial index for is_group | Most exercises not group, saves space | ✓ Good — efficient queries |
| SECURITY INVOKER for RPC | Respects RLS policies, user context preserved | ✓ Good — secure by default |
| Toast duration 4 seconds | Enough time to react, not too long | ✓ Good — balanced UX |

---
*Last updated: 2026-01-28 after v1.0 milestone*
