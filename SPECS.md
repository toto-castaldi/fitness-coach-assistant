# Specifiche - Fitness Coach Assistant

## Vision

Applicazione mobile-first e PWA per fitness coach che gestiscono più clienti contemporaneamente in palestra. Il coach pianifica gli allenamenti con supporto AI e li esegue in tempo reale, modificando esercizi al volo in base alle performance del cliente.

## Concetti chiavi

### Clienti

Un cliente ha un nome e cognome. Una data di nascità e età in anni. Una descrizione e una serie di obiettivi.
L'ultimo obiettivo è quello attuale e i precedenti sono storici.
L'obiettivo è descritto da un testo e una data.

### Esercizi

Un esercizio ha un nome, una descrizione, un serie di passi descritti in blocchi che contengono a loro volta un'immagine e una descrizione.
Ad un esercizio possono essere associati una serie di tag che ne descrivono delle caratteristiche e li rendono facilmente cercabili.

### Palestre

Una palestra ha un indirizzo, un nome e una descrizione estesa dove si indicano anche le attrezzature.

### Sessioni

Le sessioni di allenamento possono essere anche inserite manualmente visto che i clienti li seguo da tempo.
In generale il coach ha pieno controllo delle sessioni tramite un CRUD.
Una sessione è legata ad un cliente, una palestra ad ha una data. Contiene una serie di esercizi e uno stato (da svolgere o svolta).

Una sessione può avere due stati :
pianificata
completa

Esempio di sessione : 
Cliente : Mario Rossi
Data : 20 Dicembre 2025
Palestra : Fit Active Milano 1
Stato : svolta
Esercizi :
01 - Cyclette a ritmo moderato - 4 min
02 - Circonduzioni anche e ginocchia - 2 min
03 - Cat-cow (quadrupedia) - 2 min  
04 - Rotazioni busto da seduto - 1 min
05 - Shoulder rolls - 1 min
06 - Squat a corpo libero - 3 serie × 15 ripetizioni
07 - Distensioni su panca piana con manubri - 3 kg - 3 serie × 12 ripetizioni
08 - Stacchi rumeni con kettlebell - 12 kg - 3 serie × 12 ripetizioni
09 - Dead bug - 3 serie × 10 ripetizioni per lato  
10 - Plank laterale - 3 serie × 30 sec per lato
11 - Stretching flessori dell'anca - 1 min per lato  

In una sessione un determinato esercizio può essere configurato con :
- durata in minuti o secondi
- serie, ripetizioni e peso
- serie, ripetizioni
- serie e durata in minuti o secondi
- una nota (per es: da fare piano con focus sulla fase eccentrica)

Un esercizio deve essere prima censito tra quelli conosciuti nel sistema

Durante l'esecuzione live di una sessione un esercizio può essere saltato. Questo va memorizzato.

## Pianificazione AI

Il coach usa una chat LLM per pianificare le nuove sessioni di allenamento per i clienti.
Il coach può scegliere provider tra OpenAI e Antrophic e anche il modello.

Anthropic :
- Opus 4.5
- Sonnet 4.5
- Haiku 4.5

OpenAI :
- GPT 5.1
- GPT 4.o

Gli esercizi pianificati con AI devono essere censiti tra gli esercizi del sistema.
L'utlima scelta del coach di provider e modello viene salvata in modo da riproporla nella pianificazione AI successiva.

La nuova sessione creata da AI ha stato "pianificata" e data di oggi.

## Configurazione

Il coach autenticato ha una pagina di configurazione accessibile da menù in alto a destra.
Gestisce chiavi API OpenAI e Antrophic.
Gestisce logout.

## Versioning

La versione dell'app viene generata automaticamente ad ogni push su main.

### Formato versione

`YYYY.MM.DD.HHMM` (es: 2025.12.22.1648)

### Dove viene mostrata

- **Menu utente**: nel dropdown in alto a destra, voce "Versione X.X.X.X"
- **README.md**: aggiornato automaticamente dalla GitHub Action

### Meccanismo

1. La GitHub Action genera la versione basata su timestamp UTC
2. Aggiorna README.md con la nuova versione
3. Committa con `[skip ci]` per evitare loop
4. Passa `VITE_APP_VERSION` al build


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
- `/gyms` - Lista palestre
- `/sessions` - Lista sessioni
- `/sessions/:id` - Dettaglio sessione
- `/planning` - Pianificazione AI
- `/settings` - Configurazione (API keys, logout)

---

## V1 - Live Coaching

### Obiettivo

Permettere al coach di gestire più clienti contemporaneamente durante una sessione in palestra. Il coach dice che esercizio fare di volta in volta e può modifica in tempo reale la sessione (per esempio il cliente NON riesce a finire una serie allora il coach cambia peso o numero ripetizioni).

### Flusso Utente

```
INIZIO LEZIONE
├── Seleziona data di allenamento
└── i clienti che hanno in quella data una sessione pianificata vengono selezionate

DURANTE LA LEZIONE
├── Dashboard con tutti i clienti selezionati al passo precedente
├── Per ogni cliente:
│   ├── Visualizza esercizio corrente + prossimo
│   ├── Modifica al volo (reps/serie/peso)
│   └── Segna completato → avanza al prossimo
└── Cambio rapido tra clienti (swipe/tap)

FINE LEZIONE
└── Le sessioni dei clienti cambiano stato da pianifica a eseguito
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

## Progressive Web App

L'applicazione è disponibile come PWA installabile su dispositivi Android.

### Piattaforma Target

- **Android** (Chrome): installazione nativa tramite prompt automatico
- Browser desktop: utilizzo via web standard

### Assets

- Icona base: `icon-256.ico` (nella root del progetto, upscalata per 512x512)
- Icone generate: 192x192, 512x512 (standard + maskable)

### Funzionalità PWA

- Installazione da browser Chrome su Android
- Caching offline per consultazione dati
- Aggiornamento automatico service worker

---

## Note Tecniche

### Mobile-First

- Touch-friendly: bottoni grandi, swipe gestures
- Offline-capable: service worker con Workbox
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
