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

- [x] Migration `006_sessions.sql`:
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

## Milestone 3: AI Planning

Obiettivo: Permettere al coach di creare sessioni di allenamento tramite chat con LLM (ChatGPT o Claude), basandosi su storico sessioni, scheda cliente e obiettivo.

### 3.1 Database

- [x] Migration `007_ai_planning.sql`:
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

- [x] Migration `008_coach_ai_settings.sql`:
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
- [x] Applicare migration `007_ai_planning.sql`
- [x] Deploy Edge Function `ai-chat`
- [X] Test manuale flusso completo:
  - [X] Selezione cliente
  - [X] Chat con AI
  - [X] Generazione piano
  - [X] Accettazione e creazione sessione

---

## Milestone 4: Live Coaching

---

## Debiti tecnici

- [ ] Devops: GitHub Action per deploy Edge Functions
- [ ] Devops: Push automatico migrazioni (da valutare)

# Idee

- [ ] AI : introdurre nuovi provider e modelli per la pianificazione AI