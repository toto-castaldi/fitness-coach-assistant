# Milestone 11: Helix Live Tablet PWA

## Obiettivo

Creare un nuovo client PWA separato (`live.helix.toto-castaldi.com`) ottimizzato per tablet in landscape, dedicato esclusivamente alle sessioni live coaching in palestra.

## UI Design (dal mockup)

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

* Ogni esercizio (precedente, corrente, successivo) mostra:
  - Nome esercizio
  - DESC (descrizione)
  - SERIE / RIPET
  - PESO / DURATA

* L'esercizio CORRENTE ha i controlli +/- attivi per modificare i valori
* Gli esercizi adiacenti mostrano i valori in sola lettura
```

### Client Avatar
- Mostra **iniziali** (2 lettere da nome+cognome) con **sfondo colorato**
- Colori diversi per ogni cliente (generati da hash del nome)
- Nessuna foto profilo in questa versione

---

## Approccio Architetturale

**Multi-entry Vite Configuration** - Due entry point nello stesso repository che condividono codice ma producono build indipendenti.

### Struttura Directory

```
helix/
├── index.html                    # Entry app principale (esistente)
├── live.html                     # NUOVO: Entry app tablet
├── vite.config.ts                # Config app principale (esistente)
├── vite.config.live.ts           # NUOVO: Config app tablet
├── public/                       # Assets app principale (esistente)
├── public-live/                  # NUOVO: Assets app tablet
│   ├── icon-192.png
│   ├── icon-512.png
│   └── logo.svg
├── src/
│   ├── main.tsx                  # Entry app principale (esistente)
│   ├── main-live.tsx             # NUOVO: Entry app tablet
│   ├── App.tsx                   # Root app principale (esistente)
│   ├── AppLive.tsx               # NUOVO: Root app tablet
│   │
│   ├── shared/                   # NUOVO: Codice condiviso
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── utils.ts
│   │   │   └── liveCoachingStorage.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useLiveCoaching.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── components/
│   │       └── ui/               # shadcn/ui components
│   │
│   ├── lib/                      # Re-export da shared (compatibilita)
│   ├── hooks/                    # Re-export da shared (compatibilita)
│   ├── types/                    # Re-export da shared (compatibilita)
│   │
│   └── live/                     # NUOVO: Componenti app tablet
│       ├── components/
│       │   ├── TabletLayout.tsx
│       │   ├── ClientStripBar.tsx
│       │   ├── ClientAvatar.tsx
│       │   ├── ActionPanel.tsx
│       │   ├── ExerciseCarousel.tsx
│       │   ├── ExerciseCard.tsx
│       │   └── ParameterControl.tsx
│       └── pages/
│           ├── TabletLogin.tsx
│           ├── TabletDateSelect.tsx
│           └── TabletLive.tsx
```

---

## Piano di Implementazione

### Fase 0: Documentazione
- Aggiornare `docs/ROADMAP.md`
- Aggiornare `CLAUDE.md`
- Aggiornare `docs/SPECS.md`
- Creare `docs/MILESTONE-11-LIVE-TABLET.md`

### Fase 1: Struttura Progetto
- Creare `src/shared/` e spostare file condivisi
- Creare re-export per compatibilita app principale
- Verificare che l'app principale funzioni ancora

### Fase 2: Setup Multi-Entry Vite
- Creare `live.html`
- Creare `vite.config.live.ts`
- Creare `public-live/` con icone tablet-specific
- Aggiungere script npm `dev:live` e `build:live`

### Fase 3: Entry Point e Auth
- Creare `src/main-live.tsx`
- Creare `src/AppLive.tsx`
- Creare `src/live/pages/TabletLogin.tsx`

### Fase 4: Layout Tablet
- Creare `TabletLayout.tsx`
- Creare `ClientStripBar.tsx`
- Creare `ClientAvatar.tsx`

### Fase 5: Componenti Esercizi
- Creare `ActionPanel.tsx`
- Creare `ExerciseCarousel.tsx`
- Creare `ExerciseCard.tsx`
- Creare `ParameterControl.tsx`

### Fase 6: Pagine Tablet
- Creare `TabletDateSelect.tsx`
- Creare `TabletLive.tsx`

### Fase 7: Deployment
- Aggiornare `.github/workflows/deploy.yml`
- Configurare Nginx per `live.helix.toto-castaldi.com`

---

## Configurazione Ambiente

### GitHub Secrets Aggiuntivi
- `DEPLOY_PATH_LIVE` - Path deploy per app live

### Supabase Dashboard
- Aggiungere redirect URL: `https://live.helix.toto-castaldi.com`

### Nginx
- Nuovo server block per `live.helix.toto-castaldi.com`

---

## Verifica

1. **Dev locale**: `npm run dev:live` su porta 5174
2. **Build**: `npm run build:live` produce `dist-live/`
3. **PWA**: Manifest con orientation landscape
4. **Auth**: Login Google funziona su nuovo dominio
5. **Funzionalita**: Tutte le operazioni live coaching funzionano
6. **Touch**: Target touch >= 48px
7. **Landscape**: Layout ottimizzato per tablet orizzontale
