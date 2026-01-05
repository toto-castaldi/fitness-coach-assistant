# Specifiche Tecniche - Fitness Coach Assistant

Documentazione tecnica dettagliata delle funzionalità implementate.

---

## Repository Lumio - Sincronizzazione

### Panoramica

I coach possono censire repository GitHub contenenti carte Lumio (documenti markdown che descrivono esercizi). Il sistema sincronizza automaticamente le carte localmente, permettendo di associarle agli esercizi.

### Flusso di Sincronizzazione

```
┌─────────────────────────────────────────────────────────────────┐
│                    INIZIO SYNC                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Fetch ultimo commit hash da GitHub (branch: main)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Confronta con last_commit_hash salvato                      │
│     ├─ SE uguale E non force → EARLY EXIT (nessuna modifica)    │
│     └─ SE diverso → continua sync                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Fetch tree repository + parse .lumioignore                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Carica carte esistenti con content_hash dal DB              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Per ogni file .md nel tree:                                 │
│     ├─ Fetch contenuto raw                                      │
│     ├─ Calcola SHA-256 del contenuto                            │
│     ├─ Confronta con hash carta esistente                       │
│     │   ├─ SE hash uguale → SKIP (unchanged++)                  │
│     │   ├─ SE carta nuova → PROCESS + INSERT (added++)          │
│     │   └─ SE hash diverso → PROCESS + UPDATE (updated++)       │
│     └─ Se processata: fetch immagini, upload, upsert carta      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Marca carte non più nel tree come source_available=false    │
│     (removed++)                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Aggiorna repository con:                                    │
│     - last_commit_hash                                          │
│     - last_commit_at (data ultimo commit GitHub)                │
│     - last_sync_at                                              │
│     - cards_count                                               │
│     - last_sync_added, last_sync_updated,                       │
│       last_sync_removed, last_sync_unchanged                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FINE SYNC                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Ottimizzazione con Content Hash

Ogni carta ha un campo `content_hash` che contiene l'hash SHA-256 del contenuto raw markdown. Questo permette di:

1. **Evitare riprocessamento**: Se l'hash è identico, la carta non è cambiata
2. **Risparmiare bandwidth**: Non serve scaricare/processare immagini per carte invariate
3. **Tracking preciso**: Sapere esattamente cosa è cambiato

```
┌─────────────────┐     ┌─────────────────┐
│  raw_content    │────▶│   SHA-256       │────▶ content_hash
│  (markdown)     │     │   (64 chars)    │      (stored in DB)
└─────────────────┘     └─────────────────┘
```

### Delta Statistics

Dopo ogni sync, il sistema traccia:

| Campo | Descrizione |
|-------|-------------|
| `last_sync_added` | Numero carte nuove aggiunte |
| `last_sync_updated` | Numero carte modificate (hash diverso) |
| `last_sync_removed` | Numero carte rimosse dal sorgente |
| `last_sync_unchanged` | Numero carte invariate (skipped) |

**Visualizzazione UI:**
- Se ci sono modifiche: "5 aggiunte, 3 modificate, 1 rimossa"
- Se tutto invariato: "Nessuna modifica"

### Branch Fisso

Il sistema usa sempre il branch `main`. Non è configurabile dall'utente.

**Motivazione:**
- Semplifica l'UX (un campo in meno)
- La maggior parte dei repository usa `main` come default
- Evita confusione con branch di sviluppo

---

## Schema Database - Lumio

### lumio_repositories

```sql
CREATE TABLE lumio_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  github_owner text NOT NULL,
  github_repo text NOT NULL,
  access_token text,                    -- Per repo privati
  last_commit_hash text,                -- Ultimo commit sincronizzato
  last_commit_at timestamptz,           -- Data ultimo commit GitHub
  last_sync_at timestamptz,             -- Timestamp ultimo sync
  sync_status text NOT NULL DEFAULT 'pending',  -- pending|syncing|synced|error
  sync_error text,                      -- Messaggio errore se fallito
  cards_count integer NOT NULL DEFAULT 0,
  -- Delta tracking (Milestone 9)
  last_sync_added integer NOT NULL DEFAULT 0,
  last_sync_updated integer NOT NULL DEFAULT 0,
  last_sync_removed integer NOT NULL DEFAULT 0,
  last_sync_unchanged integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE UNIQUE INDEX ON lumio_repositories (user_id, github_owner, github_repo);
CREATE INDEX ON lumio_repositories (sync_status);
CREATE INDEX ON lumio_repositories (last_sync_at);
CREATE INDEX ON lumio_repositories (last_commit_at);
```

### lumio_cards

```sql
CREATE TABLE lumio_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES lumio_repositories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  file_path text NOT NULL,              -- Path nel repo (es: "exercises/squat.md")
  title text,                           -- Da frontmatter o filename
  content text NOT NULL,                -- Markdown con URL immagini risolti
  raw_content text NOT NULL,            -- Markdown originale
  content_hash text,                    -- SHA-256 di raw_content (Milestone 9)
  frontmatter jsonb,                    -- YAML frontmatter parsato
  source_available boolean NOT NULL DEFAULT true,  -- false se rimosso dal repo
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE UNIQUE INDEX ON lumio_cards (repository_id, file_path);
CREATE INDEX ON lumio_cards (user_id);
CREATE INDEX ON lumio_cards (content_hash);
CREATE INDEX ON lumio_cards USING GIN (frontmatter);  -- Per ricerca tags
```

### lumio_card_images

```sql
CREATE TABLE lumio_card_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES lumio_cards(id) ON DELETE CASCADE NOT NULL,
  original_path text NOT NULL,          -- Path nel markdown
  storage_path text NOT NULL,           -- Path in Supabase Storage
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX ON lumio_card_images (card_id, original_path);
```

---

## Edge Functions

### lumio-sync-repo

**Endpoint:** `POST /functions/v1/lumio-sync-repo`

**Auth:** Bearer token (JWT)

**Request:**
```json
{
  "repositoryId": "uuid",
  "force": false          // Opzionale: forza sync anche se hash uguale
}
```

**Response (successo):**
```json
{
  "success": true,
  "stats": {
    "added": 5,
    "updated": 2,
    "removed": 1,
    "unchanged": 42
  },
  "cardsCount": 49,
  "commitHash": "abc123..."
}
```

**Response (già aggiornato):**
```json
{
  "success": true,
  "message": "Already up to date",
  "stats": {
    "added": 0,
    "updated": 0,
    "removed": 0,
    "unchanged": 50
  }
}
```

**Response (errore):**
```json
{
  "success": false,
  "error": "Repository not found"
}
```

### lumio-check-pending

**Endpoint:** `POST /functions/v1/lumio-check-pending`

**Auth:** Service role key

**Descrizione:** Chiamata da job esterno per sincronizzare repository pending.

---

## Formato .lumioignore

File opzionale nella root del repository per escludere file dalla sincronizzazione.

```
# Commenti con #
README.md
LICENSE
private/
drafts/
*.draft.md
```

**Pattern supportati:**
- File esatti: `README.md`
- Directory: `private/`
- Wildcard estensione: `*.draft.md`

**Pattern ignorati di default:**
- `README.md`, `LICENSE`
- `.git/`, `.github/`
- `node_modules/`

---

## Formato Frontmatter Carte

```yaml
---
title: Nome Esercizio
tags:
  - forza
  - gambe
  - quadricipiti
difficulty: 3        # 1-5 (Principiante → Esperto)
language: it         # ISO code
---

# Contenuto Markdown...
```

**Campi opzionali:**
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `title` | string | Titolo visualizzato (default: nome file) |
| `tags` | string[] | Tags per categorizzazione |
| `difficulty` | 1-5 | Livello difficoltà |
| `language` | string | Codice lingua ISO |

---

## Storage Bucket

**Bucket:** `lumio-images`

**Struttura path:** `{user_id}/{repository_id}/{hash}.{ext}`

**Esempio:** `abc123/def456/a1b2c3d4e5f6.png`

**Configurazione:**
- File size limit: 10MB
- MIME types: image/jpeg, image/png, image/gif, image/webp
- Accesso: pubblico in lettura
