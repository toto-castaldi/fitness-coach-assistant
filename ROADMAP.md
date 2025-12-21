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

## Milestone 2: Sessioni (struttura base)

### 2.1 Database
- [ ] Migration: tabella `sessions`
- [ ] Migration: tabella `session_exercises`
- [ ] RLS policies

### 2.2 Types
- [ ] Tipi TypeScript per sessioni

### 2.3 Hook
- [ ] `useSessions.ts` con CRUD

### 2.4 Componenti & Pagine
- [ ] Componenti sessione
- [ ] Pagina lista sessioni
- [ ] Pagina dettaglio/edit sessione

---

## Milestone 3: AI Planning

### 3.1 Integrazione LLM

- [ ] Configurazione API (ChatGPT / Claude)
- [ ] Edge Function per generazione piano

### 3.2 Chat Interface

- [ ] UI chat per pianificazione
- [ ] Creazione sessione da proposta AI

---

## Milestone 4: Live Coaching

### 4.1 Dashboard Live

- [ ] Vista clienti con sessioni programmate
- [ ] Cambio rapido tra clienti

### 4.2 Gestione Esercizio

- [ ] Vista esercizio corrente + prossimo
- [ ] Modifica al volo (reps/serie/peso)
- [ ] Segna completato

### 4.3 Fine Sessione

- [ ] Cambio stato sessione (da_svolgere → svolta)

---

## Stato Corrente

**Completata**: Milestone 1 - Palestre
**Prossima**: Milestone 2 - Sessioni
