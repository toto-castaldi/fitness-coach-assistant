# Roadmap - Helix

## Versione 1

### Milestone 1: Palestre ✅

#### 1.1 Database

- [x] Migration: tabella `gyms` (id, user_id, name, address, description, created_at, updated_at)
- [x] RLS policies per `gyms`

#### 1.2 Types

- [x] Aggiungere tipi TypeScript: `Gym`, `GymInsert`, `GymUpdate`

#### 1.3 Hook

- [x] Creare `useGyms.ts` con CRUD operations

#### 1.4 Componenti

- [x] `GymForm.tsx` - Form creazione/modifica palestra
- [x] `GymCard.tsx` - Card per lista palestre

#### 1.5 Pagina

- [x] `Gyms.tsx` - Pagina lista palestre con CRUD
- [x] Aggiungere route `/gyms` in App.tsx
- [x] Aggiungere bottone navigazione in Layout.tsx

#### 1.6 Test & Build

- [x] Verificare build senza errori
- [x] Test manuale funzionalità

---

### Milestone 2: Sessioni ✅

#### 2.1 Database

- [x] Migration :
  - Tabella `sessions` (id, client_id, gym_id, session_date, status, notes, created_at, updated_at)
  - Tabella `session_exercises` (id, session_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds, notes)
  - RLS policies per entrambe le tabelle
  - Trigger updated_at per sessions
  - Indici per performance

#### 2.2 Hook

- [x] Creare `useSessions.ts` con:
  - `fetchSessions()` - lista sessioni con filtri opzionali
  - `getSession(id)` - sessione singola con client, gym, exercises
  - `createSession()`, `updateSession()`, `deleteSession()`
  - `addExercise()`, `updateExercise()`, `removeExercise()`, `reorderExercises()`

#### 2.3 Componenti

- [x] `SessionForm.tsx` - Form creazione/modifica sessione
- [x] `SessionCard.tsx` - Card per lista sessioni
- [x] `SessionExerciseCard.tsx` - Card esercizio con controlli inline
- [x] `ExercisePicker.tsx` - Dialog selezione esercizio da catalogo

#### 2.4 Pagine

- [x] `Sessions.tsx` - Lista sessioni con filtri
- [x] `SessionDetail.tsx` - Dettaglio sessione con CRUD esercizi
- [x] Aggiungere route `/sessions` in App.tsx
- [x] Aggiungere route `/sessions/:id` in App.tsx
- [x] Aggiungere bottone navigazione in Layout.tsx

#### 2.5 Test & Build

- [x] Verificare build senza errori
- [X] Test manuale funzionalità

---

### Milestone 3: AI Planning ✅

Obiettivo: Permettere al coach di creare sessioni di allenamento tramite chat con LLM (ChatGPT o Claude), basandosi su storico sessioni, scheda cliente e obiettivo.

#### 3.1 Database

- [x] Migration :
  - Tabella `ai_conversations` (id, user_id, client_id, created_at, updated_at)
  - Tabella `ai_messages` (id, conversation_id, role, content, created_at)
  - Tabella `ai_generated_plans` (id, conversation_id, session_id, plan_json, accepted, created_at)
  - RLS policies per tutte le tabelle
  - Indici per performance

#### 3.2 Edge Function

- [x] Creare Edge Function `ai-chat`:
  - Endpoint POST per inviare messaggi
  - Costruzione prompt di sistema con contesto cliente
  - Supporto OpenAI (GPT-4) e Anthropic (Claude)
  - API key da Supabase secrets
  - Parsing strutturato per generare piano esercizi

#### 3.3 Types

- [x] Aggiungere tipi TypeScript:
  - `AIConversation`, `AIConversationInsert`
  - `AIMessage`, `AIMessageInsert`
  - `AIRole = 'user' | 'assistant' | 'system'`
  - `AIGeneratedPlan`, `AIGeneratedPlanInsert`
  - `TrainingPlanExercise` (struttura esercizio proposto da AI)

#### 3.4 Hook

- [x] Creare `useAIPlanning.ts` con:
  - `conversation` - conversazione corrente
  - `messages` - messaggi della conversazione corrente
  - `loading`, `sending` - stati di caricamento
  - `startConversation(clientId)` - inizia nuova chat
  - `sendMessage(content)` - invia messaggio e riceve risposta
  - `acceptPlan()` - accetta piano e crea sessione
  - `clearPlan()` - rifiuta e continua chat

#### 3.5 Componenti

- [x] `ClientSelector.tsx` - Selezione cliente per planning
- [x] `AIChatInterface.tsx` - Interfaccia chat completa
  - Header con info cliente
  - Lista messaggi scrollabile
  - Input messaggio con invio
  - Indicatore loading
- [x] `AIMessageBubble.tsx` - Singolo messaggio (user/assistant)
- [x] `PlanPreview.tsx` - Preview piano generato
  - Lista esercizi proposti
  - Bottoni Accetta/Modifica/Rifiuta
- [x] `PlanExerciseRow.tsx` - Riga esercizio nel piano

#### 3.6 Pagine

- [x] `Planning.tsx` - Pagina principale AI planning
  - Step 1: Selezione cliente
  - Step 2: Chat con AI
  - Step 3: Review e conferma piano
- [x] Aggiungere route `/planning` in App.tsx
- [x] Aggiungere route `/planning/:clientId` in App.tsx
- [x] Aggiungere bottone "Pianifica con AI" in Sessions.tsx

#### 3.7 Integrazione

- [x] Costruzione contesto per AI:
  - Scheda cliente (nome, età, note fisiche)
  - Obiettivo attuale del cliente
  - Ultime 5 sessioni con esercizi
  - Lista palestre disponibili
  - Catalogo esercizi disponibili
- [x] Creazione sessione da piano accettato:
  - Mapping esercizi AI → exercise_id reali
  - Creazione session + session_exercises

#### 3.8 Configurazione AI per Coach

- [x] Migration :
  - Tabella `coach_ai_settings` (user_id, openai_api_key, anthropic_api_key, preferred_provider, preferred_model)
  - RLS policies
- [x] Creare `useAISettings.ts` hook per CRUD settings
- [x] Creare `AISettingsPanel.tsx` per configurare API keys nella chat
- [x] Aggiungere selettore provider/modello in `AIChatInterface.tsx`
- [x] Modificare Edge Function per ricevere API key e modello dal client
- [x] Aggiornare `useAIPlanning.ts` per passare settings
- [x] Creare pagina `Settings.tsx` dedicata con:
  - Configurazione API keys OpenAI/Anthropic
  - Selezione provider e modello preferiti
  - Logout
- [x] Aggiungere menu utente dropdown in `Layout.tsx`
- [x] Aggiungere route `/settings` in App.tsx

#### 3.9 Test & Build

- [x] Verificare build senza errori
- [x] Applicare migration 
- [x] Deploy Edge Function `ai-chat`
- [X] Test manuale flusso completo:
  - [X] Selezione cliente
  - [X] Chat con AI
  - [X] Generazione piano
  - [X] Accettazione e creazione sessione

---

### Milestone 4: Progressive Web App ✅

Obiettivo: Trasformare l'applicazione in una PWA installabile su Android con supporto offline.

#### 4.1 Setup Plugin PWA

- [x] Installare `vite-plugin-pwa`
- [x] Configurare `vite.config.ts` con VitePWA plugin
- [x] Configurare strategia di caching (NetworkFirst per API, CacheFirst per assets)

#### 4.2 Web App Manifest

- [x] Configurare manifest in VitePWA:
  - Nome: "Helix"
  - Short name: "Helix"
  - Theme color e background color
  - Display: standalone
  - Orientation: portrait
  - Start URL e scope

#### 4.3 Icone PWA

- [x] Generare icone da `icon-256.ico` (upscalate):
  - 192x192 (Android standard)
  - 512x512 (Android standard)
  - 512x512 maskable
- [x] Generare favicon.ico

#### 4.4 Meta Tag e HTML

- [x] Aggiornare `index.html`:
  - Title: "Helix"
  - Meta description
  - Meta theme-color

#### 4.5 Service Worker e Caching

- [x] Configurare Workbox precaching per assets statici
- [x] Configurare runtime caching per API Supabase:
  - Auth: NetworkOnly
  - Data API: NetworkFirst con fallback cache
  - Storage (immagini): CacheFirst
- [x] Gestire aggiornamento service worker con prompt utente (`PWAUpdatePrompt.tsx`)

#### 4.6 Offline Support

- [x] Mostrare indicatore stato connessione (`OfflineIndicator.tsx`)
- [x] Cache dati essenziali (clienti, sessioni giorno, esercizi) - gestito da Workbox runtime caching

#### 4.7 Installazione PWA

- [x] Creare componente `InstallPrompt.tsx`
- [x] Gestire evento `beforeinstallprompt`
- [x] Salvare stato installazione in localStorage

#### 4.8 Test & Build

- [x] Verificare build senza errori
- [X] Testare installazione su Android (Chrome)

---

### Milestone 5: Live Coaching ✅

Obiettivo: Permettere al coach di gestire più clienti contemporaneamente durante una sessione in palestra, modificando esercizi al volo in base alle performance.

#### 5.1 Database

- [x] Migration `00000000000001_live_coaching.sql`:
  - Aggiungere a `session_exercises`: campo `completed` (boolean DEFAULT false), `completed_at` (timestamp)
  - Aggiungere a `sessions`: campo `current_exercise_index` (integer DEFAULT 0)
  - Indici per performance su campi completed

#### 5.2 Types

- [x] Aggiungere/estendere tipi TypeScript:
  - Estendere `SessionExercise` con `completed`, `completed_at`
  - Estendere `Session` con `current_exercise_index`

#### 5.3 Hook

- [x] Creare `useLiveCoaching.ts` con:
  - `fetchSessionsForDate(date)` - fetch sessioni pianificate per una data
  - `getCurrentExercise/getNextExercise` - esercizio corrente e prossimo
  - `completeExercise(sessionId, exerciseId)` - segna completato e avanza
  - `skipExercise(sessionId)` - salta senza completare
  - `updateExerciseOnTheFly(sessionId, exerciseId, updates)` - modifica al volo
  - `finishSession(sessionId)` - cambia stato da planned a completed
  - `finishAllSessions()` - completa tutte le sessioni

#### 5.4 Componenti

- [x] `LiveDashboard.tsx` - Dashboard multi-cliente con swipe
- [x] `LiveClientCard.tsx` - Card cliente con esercizio corrente, prossimo e progress
- [x] `LiveExerciseControl.tsx` - Controlli inline (serie, reps, peso, durata) con Completa/Salta

#### 5.5 Pagine

- [x] `LiveCoaching.tsx` - Pagina principale:
  - Step 1: Selezione data → mostra clienti con sessioni pianificate
  - Step 2: Dashboard live → gestione multi-cliente
  - Step 3: Fine lezione → riepilogo e conferma
- [x] Aggiungere route `/live` in App.tsx
- [x] Aggiungere bottone "Live" in Layout.tsx (bottom nav)

#### 5.6 UX Mobile

- [x] Swipe orizzontale per cambio cliente
- [x] Indicatori cliente (dots)
- [x] Bottoni grandi per azioni principali
- [x] Animazioni fluide transizione tra clienti

#### 5.7 Test & Build

- [x] Verificare build senza errori
- [x] Applicare migration `00000000000001_live_coaching.sql`
- [x] Test manuale flusso completo:
  - [x] Selezione data
  - [x] Visualizzazione clienti con sessioni pianificate
  - [x] Modifica esercizi al volo
  - [x] Completamento esercizi
  - [x] Cambio cliente swipe
  - [x] Fine sessione e cambio stato

---

### Milestone 6: Local Development

Obiettivo: Configurare un ambiente di sviluppo locale completo con Supabase CLI, eliminando la dipendenza dal progetto remoto durante lo sviluppo. Include Google OAuth locale, Edge Functions, Storage e seed data per testing.

#### 6.1 Prerequisiti e Setup Iniziale

- [x] Verificare Docker installato e funzionante
- [x] Installare Supabase CLI come dev dependency: `npm install supabase --save-dev`
- [x] Aggiungere script npm per gestione Supabase locale:
  - `supabase:start` - Avvia stack locale
  - `supabase:stop` - Ferma stack locale
  - `supabase:reset` - Reset database con migrations e seed
  - `supabase:status` - Mostra stato servizi
- [x] Creare/aggiornare `supabase/config.toml` con configurazione completa

#### 6.2 Configurazione Google OAuth Locale

- [x] Documentare setup Google Cloud Console per localhost:
  - Creare OAuth 2.0 Client ID per `http://localhost:54321`
  - Configurare Authorized redirect URIs: `http://localhost:54321/auth/v1/callback`
- [x] Configurare auth in `supabase/config.toml`:
  - Abilitare Google provider
  - Configurare `site_url` e `redirect_urls` per localhost
- [x] Creare file `.env.local.example` con template variabili Google OAuth
- [x] Aggiornare `.gitignore` per escludere `.env.local` (gia' presente)

#### 6.3 Configurazione Ambiente .env

- [x] Creare `.env.local.example` per sviluppo locale con:
  - `VITE_SUPABASE_URL=http://localhost:54321`
  - `VITE_SUPABASE_ANON_KEY` (generato da `supabase start`)
- [x] Vite supporta gia' `.env.local` con priorita' (nessuna modifica necessaria)
- [x] Aggiornare `.env.example` con documentazione ambienti:
  - `.env.local` - Sviluppo locale (Supabase locale)
  - `.env` - Sviluppo remoto (Supabase cloud dev)
  - `.env.production` - Produzione

#### 6.4 Edge Functions Locali

- [x] Configurare `supabase/config.toml` per Edge Functions:
  - Abilitare edge runtime
  - Configurare verify_jwt per sviluppo
- [x] Aggiungere script npm: `supabase:functions` - Serve Edge Functions locali
- [x] Documentare come testare Edge Functions:
  - `ai-chat` con API key reali OpenAI/Anthropic
  - `client-export` per export scheda cliente
- [x] CORS gestito automaticamente da Supabase locale

#### 6.5 Storage Locale

- [x] Bucket `exercise-images` creato automaticamente da config.toml
- [x] Configurare storage in `supabase/config.toml`:
  - File size limits (10MiB per immagini)
  - Allowed MIME types (jpeg, png, gif, webp)
- [x] Upload/download funziona tramite app (testabile via frontend)

#### 6.6 Seed Data

- [x] Creare `supabase/seed.sql` con dati di esempio:
  - 15 Esercizi default (user_id=NULL, visibili a tutti)
  - Tag per ogni esercizio
  - Blocchi step-by-step per squat e plank
  - Istruzioni per creare clienti/palestre/sessioni dopo login
- [x] Seed eseguito automaticamente da `supabase db reset`
- [x] Documentato in seed.sql come aggiungere dati utente-specifici

#### 6.7 Script di Automazione

- [x] Creare script `scripts/setup-local.sh`:
  - Verifica prerequisiti (Docker, Node)
  - Copia `.env.local.example` se non esiste
  - Esegue `supabase start`
  - Mostra credenziali e URL
- [x] Creare script `scripts/dev.sh`:
  - Avvia Supabase se non attivo
  - Avvia Vite dev server
- [x] Aggiungere script npm: `setup:local` e `dev:local`

#### 6.8 Documentazione

- [x] Aggiornare `CLAUDE.md` con sezione "Local Development":
  - Quick start, comandi, URL locali, seed data
- [x] Aggiornare `README.md` con:
  - Sezione "Sviluppo Locale" completa
  - Google OAuth locale, Edge Functions
- [x] Creare `docs/LOCAL-DEVELOPMENT.md` con guida dettagliata:
  - Setup passo-passo, Google OAuth, troubleshooting

#### 6.9 Test & Validazione

- [x] Verificare `supabase start` applica tutte le migrations (5 migrations)
- [x] Verificare seed data popolato correttamente (15 esercizi + tag)
- [x] Test login Google OAuth in locale
- [x] Test CRUD completo su tutte le entita':
  - [x] Clienti
  - [x] Esercizi (con upload immagini)
  - [x] Palestre
  - [x] Sessioni
- [x] Test Edge Functions:
  - [x] `ai-chat` con provider OpenAI
  - [x] `ai-chat` con provider Anthropic
  - [x] `client-export`
- [x] Test Live Coaching flow completo
- [x] Verificare `npm run build` funziona

---

## Milestone 7: Integrazini carte Lumio

- [x] Un esercizio può avere un url di una carta in formato Lumio
- [x] Se l'esercizio ha url impostato, la sua descrizione viene sostituita dal Markdown della carta

---

## Milestone 8: Repository Carte Lumio Locali ✅

Obiettivo: Permettere ai coach di censire repository GitHub contenenti carte Lumio, sincronizzarle localmente in Helix, e selezionarle per gli esercizi tramite una UI dedicata invece che inserire URL manuali.

**Decisioni architetturali:**

- Storage: Markdown in DB (campo TEXT), immagini in Supabase Storage
- Repository: Pubblici e privati (con token accesso)
- Sync: Manuale (bottone) + automatico (job esterno periodico che chiama Edge Function)
- Scope: Per utente (ogni coach vede solo i suoi repository)
- Carte eliminate: Mantenute con warning "sorgente non trovata"
- .lumioignore: Formato semplificato (lista file/cartelle, uno per riga)
- UX selezione: Dialog modale con preview carta
- Provider: Solo GitHub

#### 8.1 Database - Tabelle Nuove

- [x] Migration `00000000000006_lumio_repositories.sql`:
  - Tabella `lumio_repositories`:
    - `id` (uuid, PK, default gen_random_uuid())
    - `user_id` (uuid, FK auth.users, NOT NULL)
    - `name` (text, NOT NULL) - nome descrittivo
    - `github_owner` (text, NOT NULL) - owner del repo
    - `github_repo` (text, NOT NULL) - nome repository
    - `branch` (text, NOT NULL, default 'main')
    - `access_token` (text, nullable) - per repo privati, encrypted
    - `last_commit_hash` (text, nullable)
    - `last_sync_at` (timestamptz, nullable)
    - `sync_status` (text, default 'pending') - 'pending' | 'syncing' | 'synced' | 'error'
    - `sync_error` (text, nullable)
    - `cards_count` (integer, default 0)
    - `created_at`, `updated_at`
  - Indice UNIQUE su (user_id, github_owner, github_repo)
  - RLS policies per user_id
  - Trigger updated_at

- [x] Migration `00000000000007_lumio_cards.sql`:
  - Tabella `lumio_cards`:
    - `id` (uuid, PK)
    - `repository_id` (uuid, FK lumio_repositories ON DELETE CASCADE)
    - `user_id` (uuid, FK auth.users) - per RLS efficiente
    - `file_path` (text, NOT NULL) - percorso nel repo
    - `title` (text, nullable) - da frontmatter
    - `content` (text, NOT NULL) - markdown con path immagini risolti
    - `raw_content` (text, NOT NULL) - markdown originale
    - `frontmatter` (jsonb, nullable) - frontmatter parsato
    - `source_available` (boolean, default true)
    - `created_at`, `updated_at`
  - Indice UNIQUE su (repository_id, file_path)
  - Indice GIN su frontmatter per ricerca tags
  - Indice full-text su title e content
  - RLS policies per user_id
  - Trigger updated_at

- [x] Migration `00000000000008_lumio_card_images.sql`:
  - Tabella `lumio_card_images`:
    - `id` (uuid, PK)
    - `card_id` (uuid, FK lumio_cards ON DELETE CASCADE)
    - `original_path` (text, NOT NULL) - path nel markdown
    - `storage_path` (text, NOT NULL) - path in Supabase Storage
    - `created_at`
  - Indice su card_id
  - RLS policies (via join con lumio_cards)

- [x] Migration `00000000000009_exercise_lumio_card.sql`:
  - Aggiungere a `exercises`: `lumio_card_id` (uuid, FK lumio_cards ON DELETE SET NULL)
  - Nota: quando impostato, ha precedenza su card_url

#### 8.2 Database - Storage Bucket

- [x] Configurare bucket `lumio-images` in `supabase/config.toml`:
  - File size limit: 10MB
  - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
  - Path structure: `{user_id}/{repository_id}/{file_hash}.{ext}`
- [x] Migration per creare bucket e policies (in 00000000000008):
  - SELECT: authenticated users possono leggere proprie immagini
  - INSERT: authenticated users possono inserire in proprio folder
  - DELETE: authenticated users possono eliminare proprie immagini

#### 8.3 Edge Functions - Sync Repository

- [x] Creare Edge Function `lumio-sync-repo`:
  - Input: `{ repositoryId: string, force?: boolean }`
  - Auth: JWT required
  - Logica:
    1. Recupera repository, verifica ownership
    2. Imposta sync_status = 'syncing'
    3. Chiama GitHub API per ultimo commit hash
    4. Se hash uguale e non force, termina
    5. Fetch tree del repository
    6. Fetch e parsa `.lumioignore` se esiste
    7. Filtra file `.md` non ignorati
    8. Per ogni file .md:
       - Fetch contenuto raw
       - Parsa frontmatter YAML
       - Estrai riferimenti immagini
       - Fetch e upload immagini in Storage
       - Sostituisci path con URL Storage
       - Upsert in lumio_cards
    9. Marca carte non più presenti: source_available = false
    10. Aggiorna repository con hash, timestamp, status, count
    11. Gestione errori: sync_status = 'error', sync_error = message
  - Output: `{ success: boolean, cardsCount: number, error?: string }`
- [x] Aggiungere a `.github/workflows/deploy.yml`

- [x] Creare Edge Function `lumio-check-pending`:
  - Input: nessuno (service_role key)
  - Logica: seleziona repo pending, chiama lumio-sync-repo
- [x] Aggiungere a `.github/workflows/deploy.yml`

#### 8.4 Edge Functions - GitHub API Helper

- [x] Creare modulo `supabase/functions/_shared/github.ts`:
  - `getLatestCommitHash(owner, repo, branch, token?)`
  - `getRepositoryTree(owner, repo, branch, token?)`
  - `getRawFileContent(owner, repo, path, branch, token?)`
  - `parseGitHubUrl(url)` - estrae owner, repo
  - `validateGitHubAccess(owner, repo, token?)`
  - Gestione rate limiting e errori (404, 403)

#### 8.5 Edge Functions - Lumio Ignore Parser

- [x] Creare modulo `supabase/functions/_shared/lumioignore.ts`:
  - `parseLumioIgnore(content: string)` - ritorna lista pattern
  - `isIgnored(filePath: string, patterns: string[])`
  - Supporto: righe vuote, commenti #, pattern esatti, directory/, wildcard *.ext

#### 8.6 Types TypeScript

- [x] Aggiungere tipi in `src/types/index.ts`:
  - `SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'`
  - `LumioRepository`, `LumioRepositoryInsert`, `LumioRepositoryUpdate`
  - `LumioCardFrontmatter` (title, tags, difficulty, language)
  - `LumioLocalCard`, `LumioLocalCardWithRepository`
- [x] Estendere tipo `Exercise` con `lumio_card_id`
- [x] Estendere `ExerciseWithDetails` con `lumio_card?`

#### 8.7 Hooks

- [x] Creare `src/hooks/useRepositories.ts`:
  - `repositories` - lista repository utente
  - `loading`, `error` - stati
  - `fetchRepositories()` - carica lista
  - `createRepository(data)` - crea nuovo
  - `updateRepository(id, data)` - modifica
  - `deleteRepository(id)` - elimina (cascade carte)
  - `syncRepository(id, force?)` - trigger sync manuale
  - `validateGitHubUrl(url, token?)` - verifica accesso

- [x] Creare `src/hooks/useLumioCards.ts`:
  - `cards` - lista carte filtrate
  - `loading`, `error` - stati
  - `fetchCards(filters?)` - carica con filtri
  - Filtri: repositoryId, search, tags, sourceAvailable
  - `getCard(id)` - carta singola
  - `allTags` - lista tutti i tag

#### 8.8 Componenti - Gestione Repository

- [x] Creare `src/components/repositories/RepositoryCard.tsx`:
  - Mostra: nome, github_owner/repo, branch, stato sync, ultimo sync, carte count
  - Badge "Privato" se ha token
  - Azioni: Modifica, Elimina, Sincronizza
  - Errore sync espandibile

- [x] Creare `src/components/repositories/RepositoryForm.tsx`:
  - Campi: Nome, URL GitHub, Branch, Token accesso
  - Parsing automatico owner/repo da URL

- [x] Creare `src/components/repositories/RepositoryList.tsx`:
  - Lista RepositoryCard
  - Empty state
  - Header con conteggio carte

- [x] Creare `src/components/repositories/SyncStatusBadge.tsx`:
  - Badge colorato per stato

#### 8.9 Componenti - Selezione Carta

- [x] Creare `src/components/lumio/LumioCardPicker.tsx`:
  - Dialog modale full-screen mobile
  - Filtri: repository, ricerca, tags
  - Lista carte con scroll
  - Warning se source_available = false
  - Footer con conteggio carte

- [x] Creare `src/components/lumio/LumioCardPickerItem.tsx`:
  - Titolo (o file_path), repository, tags, preview content
  - Icona warning se non disponibile

- [x] Creare `src/components/lumio/LumioCardPreviewInline.tsx`:
  - Preview compatta per form esercizio
  - Bottoni: Visualizza, Rimuovi
  - Warning se source_available = false

- [x] Creare `src/components/lumio/LumioLocalCardViewer.tsx`:
  - Come LumioCardViewer ma da DB locale
  - Warning banner se source_available = false
  - Mostra metadata frontmatter

#### 8.10 Pagine

- [x] Creare `src/pages/Repositories.tsx`:
  - Header: "Repository Lumio", bottone "Aggiungi"
  - RepositoryList
  - Dialog form creazione/modifica
  - Conferma eliminazione
  - Polling stato sync (ogni 5s se syncing)

- [x] Aggiungere route `/repositories` in `App.tsx`

- [x] Aggiungere voce menu in `Layout.tsx`:
  - Icona: FolderGit2
  - Label: "Repository"
  - Posizione: bottom nav dopo Esercizi

#### 8.11 Modifiche Componenti Esistenti

- [x] Modificare `src/components/exercises/ExerciseForm.tsx`:
  - Sezione "Carta Lumio Locale" sopra "URL Scheda Esterna"
  - Se ha lumio_card_id: mostra LumioCardPreviewInline
  - Bottoni Cambia/Rimuovi
  - Se no carta: bottone "Seleziona carta" → LumioCardPicker
  - Nota: lumio_card_id ha precedenza su card_url

- [x] Modificare `src/pages/ExerciseDetail.tsx`:
  - Se lumio_card_id: usa LumioLocalCardViewer
  - Warning banner se source_available = false
  - Else if card_url: LumioCardViewer (esistente)
  - Else: blocchi locali

- [x] Modificare `src/components/live/ExerciseDetailModal.tsx`:
  - Stessa logica per carte locali

- [x] Modificare `src/hooks/useExercises.ts`:
  - Join con lumio_cards in fetch
  - Gestire lumio_card_id in create/update

#### 8.12 Endpoint Sync Periodico

- [x] Edge Function `lumio-check-pending` esposta per chiamate esterne:
  - Auth: service_role key (header Authorization)
  - Logica: seleziona repo con last_sync_at > threshold, avvia sync
  - Nota: il job esterno (cron service, scheduler, etc.) chiamerà questo endpoint periodicamente

#### 8.13 Lib e Utilities

- [x] Creare `src/lib/github.ts`:
  - `parseGitHubUrl(url)` - estrae owner, repo, branch
  - `buildGitHubUrl(owner, repo)`
  - `isValidGitHubUrl(url)`

- [x] Estendere `src/lib/lumio.ts`:
  - `getCardDisplayTitle(card)` - title o filename

#### 8.14 Test & Build

- [x] Verificare build senza errori TypeScript
- [x] Applicare tutte le migrations in ordine
- [x] Deploy Edge Functions
- [x] Configurare GitHub Action sync
- [x] Test manuale flusso completo:
  - [x] Aggiunta repository pubblico
  - [x] Sync iniziale, verifica carte
  - [x] Aggiunta repository privato con token
  - [x] Verifica .lumioignore rispettato
  - [x] Verifica immagini in Storage
  - [x] Associazione carta a esercizio
  - [x] Visualizzazione esercizio con carta locale
  - [x] Modifica repo sorgente e re-sync
  - [x] Verifica warning carte eliminate
  - [x] Test sync automatico
  - [x] Test ricerca e filtri picker

#### 8.15 Documentazione

- [x] Aggiornare `CLAUDE.md`:
  - Nuove tabelle Database
  - Nuove Edge Functions
  - Bucket Storage lumio-images

- [x] Aggiornare `docs/SPECS.md`:
  - Sezione "Repository Carte Lumio"
  - Formato .lumioignore
  - Flusso sincronizzazione

---

**Ordine implementazione consigliato:**

1. Migrations database (8.1, 8.2)
2. Moduli shared Edge Functions (8.4, 8.5)
3. Edge Function sync (8.3)
4. Types TypeScript (8.6)
5. Hooks (8.7)
6. Componenti repository (8.8)
7. Pagina Repositories (8.10)
8. Componenti selezione carta (8.9)
9. Modifiche componenti esistenti (8.11)
10. Endpoint sync periodico (8.12)
11. Test e documentazione (8.14, 8.15)

**Rischi identificati:**

- Rate limiting GitHub API → backoff esponenziale
- Repository grandi → limite carte per repo
- Token scaduti → gestione errore 401
- Sync concorrenti → lock con sync_status

---

### Milestone 9: Ottimizzazione Sync Repository Lumio ✅

Obiettivo: Ottimizzare la sincronizzazione dei repository evitando di ricaricare carte non modificate, mostrando statistiche delta nell'UI, e semplificando rimuovendo il campo branch (sempre main).

#### 9.1 Database

- [x] Migration per aggiungere `content_hash` a `lumio_cards`
- [x] Migration per aggiungere campi delta a `lumio_repositories` (`last_sync_added`, `last_sync_updated`, `last_sync_removed`, `last_sync_unchanged`)
- [x] Migration per rimuovere `branch` da `lumio_repositories` (DROP COLUMN)

#### 9.2 Edge Function

- [x] Calcolo SHA-256 del `raw_content` per ogni carta
- [x] Confronto hash per skip carte invariate
- [x] Skip fetch immagini per carte invariate
- [x] Tracking statistiche: added, updated, removed, unchanged
- [x] Hardcode `branch='main'`

#### 9.3 Types e Hook

- [x] Aggiornare `LumioRepository` (rimuovi branch, aggiungi delta fields)
- [x] Aggiornare `LumioLocalCard` (aggiungi `content_hash`)
- [x] Aggiornare `useRepositories` (rimuovi branch da insert)

#### 9.4 UI

- [x] Rimuovere campo branch da `RepositoryForm`
- [x] Rimuovere visualizzazione branch da `RepositoryCard`
- [x] Aggiungere sezione delta sync in `RepositoryCard` (formato testo esteso)

#### 9.5 Documentazione

- [x] Aggiornare `CLAUDE.md` con schema DB
- [x] Aggiornare `ROADMAP.md`

#### 9.6 Test

- [x] Test sync con repository esistente
- [x] Verificare delta mostrato correttamente
- [x] Verificare carte invariate non riprocessate
- [x] Verificare build senza errori

---

## Task vari

- [x] Devops: GitHub Action per deploy Edge Functions
- [x] Devops: Push automatico migrazioni (da valutare)
- [x] Clienti : Età clienti non obbligatoria
- [x] UI : Cambia ordine dei tasti in basso. Esercizi, Palestre, Clienti e Sessioni
- [x] UI : Tasto 'live' in alto nella sezione 'sessioni'
- [x] Devops : Backup db prima di ogni deploy
- [x] Clienti : Mostra prima nome e poi cognome (in lista)
- [x] Clienti : specificare se Maschio o femmina e va in contesto per AI
- [x] Esercizi : da dettaglio esercizio, vedi sessioni che lo usano
- [x] export in markdown della scheda cliente in modo avere fallback durante allenamento
- [x] Live : posso aggiungere un esercizio durente il live
- [x] Live : Durante live posso vedere come è fatto un esercizio
- [x] Esercizi : nella scheda esercizi di tipo Lumio ci sono dei caratteri accentati errati
- [x] Esercizi : filtro "Senza info" per trovare esercizi incompleti (senza blocchi, URL Lumio o carta Lumio)
- [x] Esercizi : ordinamento per priorità (sessioni pianificate > non assegnati > solo completate)
- [x] Repository : visualizzazione elenco carte cliccando sul contatore
- [x] BUG : non riesco a chiamare /lumio/check-pending
- [ ] sync repo Lumio : ultima data di aggiornamento
- [ ] Esercizi : eliminare vecchia versione a blocchi...
- [ ] UI : la creazione/modifica di una sessione non ha il tasto di salvataggio come in tutte le altre pagine
- [ ] PWA : funziona offline da ripulire
- [ ] AI : introdurre nuovi provider e modelli per la pianificazione AI
- [ ] Clienti : storico peso
- [ ] Clienti : altezza
- [ ] Clienti : Email, Telefono, Indirizzo
- [ ] UI : Gli esercizi sono tanti. Interfaccia migliorata con scroll
- [ ] Sessioni : filtro per cliente
- [ ] Esercizi : se un tag non ha più referenze (al salvataggio faccio controllo), viene eliminato
- [ ] UI : premo su elimina esercizio e non vedo niente perchè è in alto alla lista
- [ ] Palestre : rinforzare legame con sessioni e nascondere icona delete se referenziato
- [ ] Sessioni : come caratteristica un esercizio può avere anche velocità e inclinazione (per es: tapis roultant)
- [ ] AI : modifica il piano non funziona bene...

---

### Milestone 10: Docora Integration

Integrazione con Docora per sync automatico repository Lumio via webhook.

- [x] Edge Function `docora-webhook` per ricevere webhook
- [x] Edge Function `docora-register` per registrare/deregistrare repository
- [x] Tabella `docora_chunk_buffer` per file > 1MB
- [x] Campo `docora_repository_id` in `lumio_repositories`
- [x] Supporto chunking file grandi (512KB chunks)
- [x] Autenticazione webhook con HMAC-SHA256
- [x] Deploy automatico in GitHub Action

---

### Milestone 11: Helix Live Tablet PWA (In Progress)

Obiettivo: Creare un nuovo client PWA separato (`live.helix.toto-castaldi.com`) ottimizzato per tablet in landscape, dedicato esclusivamente alle sessioni live coaching in palestra.

#### 11.0 Documentazione

- [x] Creare `docs/MILESTONE-11-LIVE-TABLET.md` con piano dettagliato
- [x] Aggiornare `CLAUDE.md` con sezione Helix Live
- [x] Aggiornare `docs/SPECS.md` con sezione V2 Live Tablet
- [x] Aggiornare `docs/ROADMAP.md` con Milestone 11

#### 11.1 Struttura Progetto (condivisione codice)

- [ ] Creare `src/shared/` con file condivisi:
  - `src/shared/lib/supabase.ts`
  - `src/shared/lib/utils.ts`
  - `src/shared/lib/liveCoachingStorage.ts`
  - `src/shared/hooks/useAuth.ts`
  - `src/shared/hooks/useLiveCoaching.ts`
  - `src/shared/types/index.ts`
  - `src/shared/components/ui/*`
- [ ] Creare re-export in `src/lib/`, `src/hooks/`, `src/types/`
- [ ] Verificare app principale funziona ancora

#### 11.2 Setup Multi-Entry Vite

- [ ] Creare `live.html` (entry HTML tablet)
- [ ] Creare `vite.config.live.ts` con PWA landscape
- [ ] Creare `public-live/` con icone tablet
- [ ] Aggiungere script `dev:live` e `build:live` a package.json

#### 11.3 Entry Point e Auth Tablet

- [ ] Creare `src/main-live.tsx`
- [ ] Creare `src/AppLive.tsx` con routing minimale
- [ ] Creare `src/live/pages/TabletLogin.tsx`

#### 11.4 Layout Tablet

- [ ] Creare `src/live/components/TabletLayout.tsx`
- [ ] Creare `src/live/components/ClientStripBar.tsx`
- [ ] Creare `src/live/components/ClientAvatar.tsx`

#### 11.5 Componenti Esercizi Tablet

- [ ] Creare `src/live/components/ActionPanel.tsx`
- [ ] Creare `src/live/components/ExerciseCarousel.tsx`
- [ ] Creare `src/live/components/ExerciseCard.tsx`
- [ ] Creare `src/live/components/ParameterControl.tsx`

#### 11.6 Pagine Tablet

- [ ] Creare `src/live/pages/TabletDateSelect.tsx`
- [ ] Creare `src/live/pages/TabletLive.tsx`

#### 11.7 Deployment

- [ ] Aggiornare `.github/workflows/deploy.yml` per build e deploy live
- [ ] Configurare Nginx per `live.helix.toto-castaldi.com`
- [ ] Aggiungere redirect URL Supabase per OAuth

#### 11.8 Test & Validazione

- [ ] Test `npm run dev:live` su porta 5174
- [ ] Test `npm run build:live` produce `dist-live/`
- [ ] Test PWA con manifest landscape
- [ ] Test login Google su nuovo dominio
- [ ] Test funzionalita live coaching complete
- [ ] Verificare touch targets >= 48px
