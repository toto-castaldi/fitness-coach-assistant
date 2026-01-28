# Phase 4: UI Live Tablet - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Vista gruppo nel live coaching tablet: tab toggle tra vista individuale e gruppo, lista esercizi di gruppo del giorno con partecipanti, complete-for-all per marcare completo tutti i partecipanti, skip individuale per eccezioni. Include RPC function per update atomico e realtime sync.

</domain>

<decisions>
## Implementation Decisions

### Layout vista gruppo
- Solo sessioni del giorno corrente (no selettore data)
- Claude's discretion: organizzazione esercizi (per esercizio vs griglia) e raggruppamento stesso tipo
- Claude's discretion: toggle Individuali/Gruppo (tab vs segmented control)

### Interazione complete-for-all
- Conferma rapida: toast con "Annulla" per 3-5 secondi dopo il tap
- Claude's discretion: posizione toast (in base al layout)
- Claude's discretion: feedback visivo stato completato (checkmark + fade vs rimozione)
- Ignora già completati: complete-for-all aggiorna solo chi non ha ancora completato

### Claude's Discretion
- Organizzazione layout vista gruppo
- Toggle pattern (tab vs segmented control)
- Raggruppamento esercizi stesso tipo
- Posizione toast conferma
- Feedback visivo completamento
- UI per skip individuale (non discusso, Claude decide approccio)
- UI indicatori partecipanti (non discusso, Claude decide approccio)

</decisions>

<specifics>
## Specific Ideas

- Il coach lavora in palestra, velocità è prioritaria — conferma non deve rallentare
- Toast con undo è pattern familiare (Gmail, etc.)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ui-live-tablet*
*Context gathered: 2026-01-28*
