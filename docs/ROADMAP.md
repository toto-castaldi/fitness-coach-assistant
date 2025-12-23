# Roadmap - Fitness Coach Assistant

## Milestone 1: Palestre ✅

### 1.1 Database

- [x] Migration: tabella `gyms` (id, user_id, name, address, description, created_at, updated_at)
- [x] RLS policies per `gyms`

### 1.2 Types

- [x] Aggiungere tipi TypeScript: `Gym`, `GymInsert`, `GymUpdate`

### 1.3 Hook

- [x] Creare `useGyms.ts` con CRUD operations

### 1.4 Componenti

- [x] `GymForm.tsx` - Form creazione/modifica palestra
- [x] `GymCard.tsx` - Card per lista palestre

### 1.5 Pagina

- [x] `Gyms.tsx` - Pagina lista palestre con CRUD
- [x] Aggiungere route `/gyms` in App.tsx
- [x] Aggiungere bottone navigazione in Layout.tsx

### 1.6 Test & Build

- [x] Verificare build senza errori
- [x] Test manuale funzionalità

---

## Milestone 2: Sessioni ✅

### 2.1 Database

- [x] Migration :
  - Tabella `sessions` (id, client_id, gym_id, session_date, status, notes, created_at, updated_at)
  - Tabella `session_exercises` (id, session_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds, notes)
  - RLS policies per entrambe le tabelle
  - Trigger updated_at per sessions
  - Indici per performance

### 2.2 Hook

- [x] Creare `useSessions.ts` con:
  - `fetchSessions()` - lista sessioni con filtri opzionali
  - `getSession(id)` - sessione singola con client, gym, exercises
  - `createSession()`, `updateSession()`, `deleteSession()`
  - `addExercise()`, `updateExercise()`, `removeExercise()`, `reorderExercises()`

### 2.3 Componenti

- [x] `SessionForm.tsx` - Form creazione/modifica sessione
- [x] `SessionCard.tsx` - Card per lista sessioni
- [x] `SessionExerciseCard.tsx` - Card esercizio con controlli inline
- [x] `ExercisePicker.tsx` - Dialog selezione esercizio da catalogo

### 2.4 Pagine

- [x] `Sessions.tsx` - Lista sessioni con filtri
- [x] `SessionDetail.tsx` - Dettaglio sessione con CRUD esercizi
- [x] Aggiungere route `/sessions` in App.tsx
- [x] Aggiungere route `/sessions/:id` in App.tsx
- [x] Aggiungere bottone navigazione in Layout.tsx

### 2.5 Test & Build

- [x] Verificare build senza errori
- [X] Test manuale funzionalità

---

## Milestone 3: AI Planning ✅

Obiettivo: Permettere al coach di creare sessioni di allenamento tramite chat con LLM (ChatGPT o Claude), basandosi su storico sessioni, scheda cliente e obiettivo.

### 3.1 Database

- [x] Migration :
  - Tabella `ai_conversations` (id, user_id, client_id, created_at, updated_at)
  - Tabella `ai_messages` (id, conversation_id, role, content, created_at)
  - Tabella `ai_generated_plans` (id, conversation_id, session_id, plan_json, accepted, created_at)
  - RLS policies per tutte le tabelle
  - Indici per performance

### 3.2 Edge Function

- [x] Creare Edge Function `ai-chat`:
  - Endpoint POST per inviare messaggi
  - Costruzione prompt di sistema con contesto cliente
  - Supporto OpenAI (GPT-4) e Anthropic (Claude)
  - API key da Supabase secrets
  - Parsing strutturato per generare piano esercizi

### 3.3 Types

- [x] Aggiungere tipi TypeScript:
  - `AIConversation`, `AIConversationInsert`
  - `AIMessage`, `AIMessageInsert`
  - `AIRole = 'user' | 'assistant' | 'system'`
  - `AIGeneratedPlan`, `AIGeneratedPlanInsert`
  - `TrainingPlanExercise` (struttura esercizio proposto da AI)

### 3.4 Hook

- [x] Creare `useAIPlanning.ts` con:
  - `conversation` - conversazione corrente
  - `messages` - messaggi della conversazione corrente
  - `loading`, `sending` - stati di caricamento
  - `startConversation(clientId)` - inizia nuova chat
  - `sendMessage(content)` - invia messaggio e riceve risposta
  - `acceptPlan()` - accetta piano e crea sessione
  - `clearPlan()` - rifiuta e continua chat

### 3.5 Componenti

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

### 3.6 Pagine

- [x] `Planning.tsx` - Pagina principale AI planning
  - Step 1: Selezione cliente
  - Step 2: Chat con AI
  - Step 3: Review e conferma piano
- [x] Aggiungere route `/planning` in App.tsx
- [x] Aggiungere route `/planning/:clientId` in App.tsx
- [x] Aggiungere bottone "Pianifica con AI" in Sessions.tsx

### 3.7 Integrazione

- [x] Costruzione contesto per AI:
  - Scheda cliente (nome, età, note fisiche)
  - Obiettivo attuale del cliente
  - Ultime 5 sessioni con esercizi
  - Lista palestre disponibili
  - Catalogo esercizi disponibili
- [x] Creazione sessione da piano accettato:
  - Mapping esercizi AI → exercise_id reali
  - Creazione session + session_exercises

### 3.8 Configurazione AI per Coach

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

### 3.9 Test & Build

- [x] Verificare build senza errori
- [x] Applicare migration 
- [x] Deploy Edge Function `ai-chat`
- [X] Test manuale flusso completo:
  - [X] Selezione cliente
  - [X] Chat con AI
  - [X] Generazione piano
  - [X] Accettazione e creazione sessione

---

## Milestone 4: Progressive Web App ✅

Obiettivo: Trasformare l'applicazione in una PWA installabile su Android con supporto offline.

### 4.1 Setup Plugin PWA

- [x] Installare `vite-plugin-pwa`
- [x] Configurare `vite.config.ts` con VitePWA plugin
- [x] Configurare strategia di caching (NetworkFirst per API, CacheFirst per assets)

### 4.2 Web App Manifest

- [x] Configurare manifest in VitePWA:
  - Nome: "Fitness Coach Assistant"
  - Short name: "FCA"
  - Theme color e background color
  - Display: standalone
  - Orientation: portrait
  - Start URL e scope

### 4.3 Icone PWA

- [x] Generare icone da `icon-256.ico` (upscalate):
  - 192x192 (Android standard)
  - 512x512 (Android standard)
  - 512x512 maskable
- [x] Generare favicon.ico

### 4.4 Meta Tag e HTML

- [x] Aggiornare `index.html`:
  - Title: "Fitness Coach Assistant"
  - Meta description
  - Meta theme-color

### 4.5 Service Worker e Caching

- [x] Configurare Workbox precaching per assets statici
- [x] Configurare runtime caching per API Supabase:
  - Auth: NetworkOnly
  - Data API: NetworkFirst con fallback cache
  - Storage (immagini): CacheFirst
- [x] Gestire aggiornamento service worker con prompt utente (`PWAUpdatePrompt.tsx`)

### 4.6 Offline Support

- [x] Mostrare indicatore stato connessione (`OfflineIndicator.tsx`)
- [x] Cache dati essenziali (clienti, sessioni giorno, esercizi) - gestito da Workbox runtime caching

### 4.7 Installazione PWA

- [x] Creare componente `InstallPrompt.tsx`
- [x] Gestire evento `beforeinstallprompt`
- [x] Salvare stato installazione in localStorage

### 4.8 Test & Build

- [x] Verificare build senza errori
- [X] Testare installazione su Android (Chrome)

---

## Milestone 5: Live Coaching ✅

Obiettivo: Permettere al coach di gestire più clienti contemporaneamente durante una sessione in palestra, modificando esercizi al volo in base alle performance.

### 5.1 Database

- [x] Migration `00000000000001_live_coaching.sql`:
  - Aggiungere a `session_exercises`: campo `completed` (boolean DEFAULT false), `completed_at` (timestamp)
  - Aggiungere a `sessions`: campo `current_exercise_index` (integer DEFAULT 0)
  - Indici per performance su campi completed

### 5.2 Types

- [x] Aggiungere/estendere tipi TypeScript:
  - Estendere `SessionExercise` con `completed`, `completed_at`
  - Estendere `Session` con `current_exercise_index`

### 5.3 Hook

- [x] Creare `useLiveCoaching.ts` con:
  - `fetchSessionsForDate(date)` - fetch sessioni pianificate per una data
  - `getCurrentExercise/getNextExercise` - esercizio corrente e prossimo
  - `completeExercise(sessionId, exerciseId)` - segna completato e avanza
  - `skipExercise(sessionId)` - salta senza completare
  - `updateExerciseOnTheFly(sessionId, exerciseId, updates)` - modifica al volo
  - `finishSession(sessionId)` - cambia stato da planned a completed
  - `finishAllSessions()` - completa tutte le sessioni

### 5.4 Componenti

- [x] `LiveDashboard.tsx` - Dashboard multi-cliente con swipe
- [x] `LiveClientCard.tsx` - Card cliente con esercizio corrente, prossimo e progress
- [x] `LiveExerciseControl.tsx` - Controlli inline (serie, reps, peso, durata) con Completa/Salta

### 5.5 Pagine

- [x] `LiveCoaching.tsx` - Pagina principale:
  - Step 1: Selezione data → mostra clienti con sessioni pianificate
  - Step 2: Dashboard live → gestione multi-cliente
  - Step 3: Fine lezione → riepilogo e conferma
- [x] Aggiungere route `/live` in App.tsx
- [x] Aggiungere bottone "Live" in Layout.tsx (bottom nav)

### 5.6 UX Mobile

- [x] Swipe orizzontale per cambio cliente
- [x] Indicatori cliente (dots)
- [x] Bottoni grandi per azioni principali
- [x] Animazioni fluide transizione tra clienti

### 5.7 Test & Build

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

## Debiti tecnici

- [x] Devops: GitHub Action per deploy Edge Functions
- [x] Devops: Push automatico migrazioni (da valutare)
- [ ] UI : la creazione/modifica di una sessione non ha il tasto di salvataggio come in tutte le altre pagine
- [ ] PWA : funziona offline da ripulire 

# Idee

- [ ] AI : introdurre nuovi provider e modelli per la pianificazione AI
- [ ] Clienti : storico peso
- [ ] Clienti : altezza
- [ ] Sessioni : export in markdown di una sessione in modo avere fallback durante allenamento
- [x] Clienti : Età clienti non obbligatoria
- [x] UI : Cambia ordine dei tasti in basso. Esercizi, Palestre, Clienti e Sessioni
- [x] UI : Tasto 'live' in alto nella sezione 'sessioni'
- [ ] Live : posso cancellare un esercizio da una sessione durante il live
- [ ] Live : posso aggiungere un esercizio durente il live