# Helix — Esercizi di Gruppo

## What This Is

Helix è un'app web per fitness coach che gestisce clienti, sessioni di allenamento e esercizi. Include una PWA tablet per il live coaching in palestra e un server MCP per pianificazione AI via Claude. Questa milestone aggiunge il supporto per esercizi di gruppo — esercizi fatti contemporaneamente da più clienti.

## Core Value

Durante le lezioni di gruppo, il coach può gestire gli esercizi condivisi da un'unica vista, completandoli una volta per tutti i partecipanti.

## Requirements

### Validated

Funzionalità esistenti, già implementate e funzionanti:

- ✓ Gestione clienti (anagrafica, obiettivi, storico) — existing
- ✓ Catalogo esercizi con tag e carte Lumio — existing
- ✓ Pianificazione sessioni con esercizi — existing
- ✓ Live coaching tablet (carousel esercizi, completamento, skip) — existing
- ✓ Sincronizzazione real-time — existing
- ✓ MCP server per integrazione AI (resources, tools, prompts) — existing
- ✓ Autenticazione Google OAuth — existing
- ✓ Gestione palestre — existing
- ✓ Repository Lumio con sync Docora — existing

### Active

Nuove funzionalità per questa milestone:

- [ ] Flag `is_group` su session_exercises (database)
- [ ] UI pianificazione: toggle "di gruppo" su esercizi in sessione
- [ ] Live tablet: tab toggle "Individuali" | "Gruppo"
- [ ] Live tablet: vista gruppo con timeline esercizi del giorno
- [ ] Live tablet: completamento di gruppo (un tap → tutti i clienti)
- [ ] MCP: lettura campo is_group negli esercizi sessione
- [ ] MCP: scrittura is_group in add/update session exercise

### Out of Scope

- Tracciamento esplicito dei partecipanti per esercizio — non necessario, ogni cliente ha la sua sessione
- Orario pianificato per esercizi — l'ordine basta, usa order_index
- Statistiche aggregate per esercizi di gruppo — può essere v2
- Notifiche ai clienti per esercizi di gruppo — non richiesto

## Context

**Codebase esistente:**
- React 19 + Vite + TypeScript frontend
- Supabase PostgreSQL backend con RLS
- Due entry point: main app + live tablet PWA
- Shared code pattern in `src/shared/`
- Custom hooks per data management (`useSessions`, `useExercises`, etc.)
- MCP server in Edge Function `helix-mcp`

**Tabella target:**
- `session_exercises` — già contiene: exercise_id, order_index, sets, reps, weight_kg, duration_seconds, completed, skipped, notes

**Live coaching attuale:**
- `TabletLive.tsx` con carousel di esercizi
- `useLiveCoaching` hook per stato e operazioni
- Seleziona client → mostra suoi esercizi → completa/skip

**MCP attuale:**
- Resource `helix://sessions/{id}` ritorna sessione con esercizi
- Tool `add_session_exercise`, `update_session_exercise` per modifiche

## Constraints

- **Tech stack**: Supabase + React esistente — nessuna nuova dipendenza
- **Schema**: Aggiungere colonna, non ristrutturare tabelle
- **Backward compatible**: Sessioni esistenti devono funzionare (is_group default false)
- **RLS**: Mantenere isolamento per coach (user_id)
- **Mobile-first**: UI tablet deve funzionare bene con touch

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Flag booleano `is_group` invece di relazione | Semplice, ogni sessione è indipendente, non serve tracciare "gruppi" come entità | — Pending |
| Tab toggle invece di filtro | Più chiaro per il coach, due modalità di lavoro distinte | — Pending |
| Completamento automatico per tutti | Efficienza durante la lezione, un tap basta | — Pending |
| Ordine da order_index | Riusa campo esistente, no schema aggiuntivo | — Pending |

---
*Last updated: 2026-01-28 after initialization*
