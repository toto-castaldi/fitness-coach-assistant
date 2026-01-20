# Specifiche - Helix

## Vision

Applicazione mobile-first e PWA per fitness coach che gestiscono più clienti contemporaneamente in palestra. Il coach pianifica gli allenamenti con supporto AI e li esegue in tempo reale, modificando esercizi al volo in base alle performance del cliente.

## Concetti chiavi

### Clienti

Un cliente ha un nome e cognome. Una data di nascità e età in anni. Una descrizione e una serie di obiettivi.
L'ultimo obiettivo è quello attuale e i precedenti sono storici.
L'obiettivo è descritto da un testo e una data.
Per il cliente si specifica se maschio o femmina.

#### Scheda Cliente

Dal dettaglio cliente e possibile esportare la scheda completa in formato markdown.
La scheda include:
- Nome e cognome
- Dati anagrafici (eta, data di nascita, genere)
- Anamnesi (note fisiche)
- Storia obiettivi (ordinati per data decrescente, il primo e l'attuale)
- Sessioni (pianificate e completate, ordinate per data decrescente)

E possibile filtrare le sessioni per palestra prima dell'export.
Questo stesso formato viene usato come contesto per la pianificazione AI.

### Esercizi

Un esercizio ha un nome, una descrizione, un serie di passi descritti in blocchi che contengono a loro volta un'immagine e una descrizione.
Ad un esercizio possono essere associati una serie di tag che ne descrivono delle caratteristiche e li rendono facilmente cercabili.

#### Filtri Esercizi

La lista esercizi supporta diversi filtri combinabili:
- **Ricerca testuale**: filtra per nome o descrizione
- **Tag**: filtra per uno o più tag (AND logic)
- **Senza tag**: mostra solo esercizi senza tag assegnati
- **Senza info**: mostra solo esercizi incompleti (senza blocchi, senza URL Lumio, senza carta Lumio locale)

I filtri speciali "Senza tag" e "Senza info" sono mutuamente esclusivi tra loro e rispetto ai tag selezionati.

#### Ordinamento Esercizi

Gli esercizi sono ordinati secondo questa priorità:
1. **Esercizi in sessioni pianificate**: esercizi assegnati ad almeno una sessione con stato "planned"
2. **Esercizi non assegnati**: esercizi mai usati in nessuna sessione
3. **Esercizi solo in sessioni completate**: esercizi usati solo in sessioni già svolte

All'interno di ogni gruppo, l'ordinamento è alfabetico per nome.

#### Carte Lumio

Un esercizio può essere associato a una **carta Lumio**, un documento markdown esterno che descrive l'esercizio in modo dettagliato. Ci sono due modalità:

1. **URL esterno** (legacy): l'esercizio punta a un URL di una carta markdown su GitHub
2. **Carta locale**: l'esercizio è collegato a una carta sincronizzata da un repository Lumio

Quando un esercizio ha una carta associata (locale o esterna), la descrizione della carta sostituisce i blocchi locali nella visualizzazione.

### Repository Carte Lumio

I coach possono censire repository GitHub contenenti carte Lumio per sincronizzarle localmente in Helix.

#### Caratteristiche

- **Repository pubblici e privati**: per i repo privati serve un token di accesso GitHub
- **Sincronizzazione**: manuale (bottone) + automatica (job esterno periodico)
- **Scope per utente**: ogni coach vede solo i propri repository censiti
- **Persistenza carte eliminate**: se una carta viene rimossa dal repo sorgente, resta disponibile in Helix con un warning "sorgente non trovata"
- **Visualizzazione carte**: cliccando sul contatore carte si apre un elenco con ricerca delle carte presenti nel repository

#### Struttura Repository

Un repository Lumio contiene:
- File `.md` (carte esercizio) con frontmatter YAML opzionale
- Immagini referenziate dalle carte
- File `.lumioignore` opzionale per escludere file dalla sincronizzazione

#### Formato .lumioignore

Formato semplificato, una riga per pattern:
```
# Commenti con #
README.md
private/
*.draft.md
```

#### Frontmatter Carta

```yaml
---
title: Nome Esercizio
tags:
  - forza
  - gambe
difficulty: 3
language: it
---
```

#### Flusso Sincronizzazione

1. Coach aggiunge repository (URL GitHub + token opzionale)
2. Sistema verifica accesso e scarica l'albero del repository
3. Per ogni file `.md` non ignorato:
   - Fetch contenuto e parse frontmatter
   - Download immagini referenziate → Supabase Storage
   - Salvataggio carta in database con path immagini risolti
4. Aggiornamento contatore carte e timestamp sync
5. Sync periodico controlla hash ultimo commit → re-sync solo se cambiato

#### Selezione Carta per Esercizio

Nel form esercizio, il coach può:
1. Aprire un dialog di selezione carte con filtri (repository, ricerca, tags)
2. Visualizzare preview della carta
3. Associare la carta all'esercizio

Le carte locali hanno precedenza sull'URL esterno.

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

### Contesto AI

L'AI riceve come contesto la **scheda cliente completa** in formato markdown, che include:
- Dati anagrafici (nome, eta, genere)
- Anamnesi (note fisiche)
- Storia obiettivi completa (ordinata per data decrescente, il primo e l'attuale)
- Tutte le sessioni con esercizi (ordinate per data decrescente)

Questo e lo stesso formato usato per l'export della scheda cliente.

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
| Export Scheda Cliente | Export markdown con dati, anamnesi, obiettivi, sessioni (filtrabili per palestra) |
| Catalogo Esercizi | CRUD con blocchi immagine, tag, ricerca, filtri avanzati (senza tag, senza info) |
| Dettaglio Esercizio | Visualizzazione step-by-step |
| Repository Lumio | Sincronizzazione carte da GitHub (pubblici/privati) |
| Pianificazione AI | Chat con LLM per creare sessioni, contesto = scheda cliente completa |
| Live Coaching | Gestione multi-cliente in tempo reale con swipe |

### Navigazione attuale

- `/` - Home (Dashboard esercizi)
- `/clients` - Lista clienti
- `/clients/:id` - Dettaglio cliente
- `/exercises` - Catalogo esercizi
- `/exercise/:id` - Dettaglio esercizio
- `/repositories` - Repository Lumio
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
---

## Progressive Web App

L'applicazione è disponibile come PWA installabile su dispositivi Android.

### Piattaforma Target

- **Android** (Chrome): installazione nativa tramite prompt automatico
- Browser desktop: utilizzo via web standard

### Assets

- Logo sorgente: `logo.svg` (nella root del progetto)
- Icone generate da `logo.svg`:
  - `public/logo.svg` - logo SVG per browser moderni
  - `public/favicon.ico` - favicon 32x32
  - `public/icon-192.png` - icona PWA 192x192
  - `public/icon-512.png` - icona PWA 512x512 (standard + maskable)

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

---

## V2 - Live Tablet PWA

### Obiettivo

Creare un'applicazione tablet separata (`live.helix.toto-castaldi.com`) ottimizzata per sessioni live coaching in palestra, con layout landscape e controlli touch ottimizzati.

### Layout UI

```
+------------------------------------------------------------------+
|  CLIENT STRIP BAR (fisso in alto)                                 |
|  [VE] [SR*] [CI] [CB]  <- Iniziali con sfondo colorato            |
+------------------------------------------------------------------+
|  +--------+  +------------------------------------------------+   |
|  | ACTION |  |  EXERCISE CAROUSEL (scroll orizzontale)         |   |
|  | PANEL  |  |                                                 |   |
|  |        |  |  +---------+  +----------+  +---------+         |   |
|  | [SKIP] |  |  | PUSHUP  |  | SQUAT*   |  |   TRX   |         |   |
|  | [DEL]  |  |  | DESC... |  | DESC...  |  | DESC... |         |   |
|  | [ADD]  |  |  | 3x12    |  | 3x12     |  | 3x12    |         |   |
|  | [OK]   |  |  | 10kg    |  | [-]15[+] |  | 5kg     |         |   |
|  |        |  |  +---------+  +----------+  +---------+         |   |
|  +--------+  |              (selezionato)                      |   |
|              +------------------------------------------------+   |
+------------------------------------------------------------------+
```

### Caratteristiche

- **Orientamento**: Landscape-only (forzato da manifest PWA)
- **Touch targets**: >= 48px per tutti i controlli
- **Avatar clienti**: Iniziali (2 lettere) con sfondo colorato generato da hash nome
- **Exercise carousel**: Scroll orizzontale con snap, mostra precedente + corrente + successivo
- **Controlli esercizio**: Solo l'esercizio corrente ha controlli +/- attivi
- **Action panel**: Bottoni grandi verticali per SKIP, DELETE, ADD, OK

### Flusso Utente Tablet

```
ACCESSO
├── Login Google (stesso account app principale)
└── Redirect a selezione data

SELEZIONE DATA
├── Calendario con date che hanno sessioni pianificate
├── Lista clienti con sessioni nella data selezionata
└── Bottone "Inizia Sessione"

SESSIONE LIVE
├── Client strip bar per switch rapido cliente
├── Exercise carousel con controlli in-line
├── Action panel per operazioni su esercizio corrente
└── Auto-save ogni modifica
```

### Differenze da App Principale

| Aspetto | App Principale | App Tablet |
|---------|----------------|------------|
| Orientamento | Portrait | Landscape |
| Navigazione | Bottom nav completa | Nessuna, solo live |
| Cambio cliente | Swipe orizzontale | Click su avatar |
| Controlli esercizio | Card espandibile | Sempre visibili |
| Target users | Uso generale | Solo in palestra |

### Architettura Tecnica

- **Entry separato**: `live.html` con `vite.config.live.ts`
- **Codice condiviso**: `src/shared/` per lib, hooks, types, ui
- **Componenti dedicati**: `src/live/` per UI tablet
- **PWA manifest**: `orientation: landscape`, `background_color: #000000`
- **Build output**: `dist-live/` deployato su dominio separato

### Navigazione Tablet

- `/` → Selezione data (TabletDateSelect)
- `/live` → Sessione live (TabletLive)

### Requisiti Deployment

- Dominio separato: `live.helix.toto-castaldi.com`
- Nginx server block dedicato
- Supabase OAuth redirect URL aggiuntivo
- GitHub Secret: `DEPLOY_PATH_LIVE`
