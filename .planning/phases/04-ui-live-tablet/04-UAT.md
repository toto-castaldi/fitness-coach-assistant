---
status: complete
phase: 04-ui-live-tablet
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-01-28T17:55:00Z
updated: 2026-01-28T18:03:00Z
---

## Current Test

[testing complete]

## Tests

### 1. View Mode Toggle
expected: In TabletLive (http://localhost:5174), vedi due pulsanti toggle in alto: "Individuali" e "Gruppo". Clicca su "Gruppo".
result: pass

### 2. Group Badge in Individual View
expected: In vista "Individuali", seleziona un cliente con una sessione. Gli esercizi marcati come "di gruppo" mostrano un badge viola con icona Users.
result: pass

### 3. Group View Shows Aggregated Exercises
expected: In vista "Gruppo", vedi la lista di tutti gli esercizi di gruppo aggregati da tutte le sessioni del giorno (non per singolo cliente).
result: pass

### 4. Participant Avatars
expected: Ogni card esercizio nella vista gruppo mostra gli avatar dei partecipanti (clienti che hanno quell'esercizio di gruppo).
result: pass

### 5. Complete-for-All
expected: Clicca "Completa tutti" su un esercizio di gruppo. Tutti i partecipanti vengono marcati come completati e appare un toast con pulsante "Annulla".
result: pass

### 6. Toast Undo
expected: Entro 4 secondi, clicca "Annulla" nel toast. L'esercizio torna allo stato precedente (non completato) per tutti i partecipanti.
result: pass

### 7. Skip Individual Participant
expected: Nella vista gruppo, clicca la X accanto a UN solo partecipante. Solo quel partecipante viene marcato come "saltato", gli altri rimangono invariati.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
