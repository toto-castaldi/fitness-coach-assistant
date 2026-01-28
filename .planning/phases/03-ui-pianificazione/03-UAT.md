---
status: complete
phase: 03-ui-pianificazione
source: [03-01-SUMMARY.md]
started: 2026-01-28T17:30:00Z
updated: 2026-01-28T17:52:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Di gruppo Toggle
expected: In SessionDetail, apri la card di un esercizio. Sotto il toggle "Saltato", vedi un toggle "Di gruppo" con icona Users. Attivalo.
result: pass

### 2. Gruppo Badge Appears
expected: Dopo aver attivato "Di gruppo", appare un badge con icona Users e testo "Gruppo" accanto al nome dell'esercizio nell'header della card.
result: pass

### 3. Summary Count Updates
expected: Nell'header della sezione esercizi (dove mostra "X esercizi"), appare "1 di gruppo" accanto (visibile solo quando almeno un esercizio è marcato come gruppo).
result: pass

### 4. Toggle Persistence
expected: Ricarica la pagina. L'esercizio marcato come "Di gruppo" ha ancora il toggle attivo e il badge visibile.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
