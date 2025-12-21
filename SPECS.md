# Specifiche - Fitness Coach Assistant

## Vision

Applicazione mobile-first per fitness coach che gestiscono più clienti contemporaneamente in palestra. Il coach pianifica gli allenamenti con supporto AI e li esegue in tempo reale, modificando esercizi al volo in base alle performance del cliente.

---

### Palestre

Una palestra ha un indirizzo, un nome e una descrizione estesa dove si indicano anche le attrezzature.

### Sessioni

Le sessioni di allenamento possono essere anche inserite manualmente visto che i clienti li seguo da tempo.
In generale il coach ha pieno controllo delle sessioni tramite un CRUD.
Una sessione è legata ad un cliente, una palestra ad ha una data. Contiene una serie di esercizi e uno stato (da svolgere o svolta).

## Stato Attuale

### Funzionalità Complete

| Feature | Descrizione |
|---------|-------------|
| Autenticazione | Google OAuth via Supabase |
| Gestione Clienti | CRUD completo con età, note fisiche |
| Obiettivi Cliente | Storico obiettivi con obiettivo attuale |
| Catalogo Esercizi | CRUD con blocchi immagine, tag, ricerca |
| Dettaglio Esercizio | Visualizzazione step-by-step |

### Navigazione attuale

- `/` - Home (Dashboard esercizi)
- `/clients` - Lista clienti
- `/clients/:id` - Dettaglio cliente
- `/exercises` - Catalogo esercizi
- `/exercise/:id` - Dettaglio esercizio

---

## V1 - Live Coaching

### Obiettivo

Permettere al coach di gestire più clienti contemporaneamente durante una sessione in palestra, con pianificazione AI e modifica esercizi in tempo reale.

### Flusso Utente

```
PRIMA DELLA LEZIONE
├── Seleziona clienti per la nuova sessione
├── tramite chat con LLM (l'applicazione è configurata per usare ChatGPT o Claud tramite API) si crea nuova sessione basandoci su : storico sessioni precenti + scheda cliente + obiettivo
└── una volta concordata la lezione viene creata una nuova sessione

DURANTE LA LEZIONE
├── Dashboard con tutti i clienti che hanno una sessione di allenamento programmata
├── Per ogni cliente:
│   ├── Visualizza esercizio corrente + prossimo
│   ├── Modifica al volo (reps/serie/peso)
│   └── Segna completato → avanza al prossimo
└── Cambio rapido tra clienti (swipe/tap)

FINE LEZIONE
└── La sessione cambia stato, da pianifica a eseguita
```

#### Vista Cliente Singolo

```
┌─────────────────────────────────┐
│  ← Mario Rossi              ⏱️  │
├─────────────────────────────────┤
│                                 │
│  ▶ ESERCIZIO CORRENTE           │
│  ┌─────────────────────────────┐│
│  │ Squat con Bilanciere       ││
│  │                            ││
│  │ Serie: [−] 4 [+]           ││
│  │ Reps:  [−] 12 [+]          ││
│  │ Peso:  [−] 40kg [+]        ││
│  └─────────────────────────────┘│
│                                 │
│  ⏭ PROSSIMO                     │
│  Leg Press · 3×15 · 80kg        │
│                                 │
│  ┌─────────────────────────────┐│
│  │     ✅ COMPLETATO           ││
│  └─────────────────────────────┘│
│                                 │
│  [Salta] [Note]                 │
│                                 │
├─────────────────────────────────┤
│  ◀ Prev    2/8    Next ▶        │
└─────────────────────────────────┘
```

---

## Note Tecniche

### Mobile-First
- Touch-friendly: bottoni grandi, swipe gestures
- Offline-capable: localStorage per recovery
- Fast: minimal re-renders, ottimizzazione liste

### Performance
- Lazy loading pagine
- Virtualizzazione liste lunghe
- Debounce modifiche frequenti

### Sicurezza
- RLS su tutte le nuove tabelle
- Validazione input con Zod
- Rate limiting su Edge Functions AI

---

## Metriche di Successo V1

- [ ] Coach può creare piano per cliente in < 4 minuti
- [ ] Coach può gestire 3+ clienti simultaneamente
- [ ] Cambio cliente in < 1 secondo
- [ ] Modifica esercizio in < 2 tap
- [ ] Modifiche alla Sessione senza perdita dati
