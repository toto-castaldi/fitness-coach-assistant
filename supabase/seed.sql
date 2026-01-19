-- Fitness Coach Assistant - Seed Data per sviluppo locale
-- Eseguito automaticamente dopo le migrations con 'supabase db reset'

-- NOTA: I dati seed usano un user_id fittizio.
-- Al primo login, dovrai creare i tuoi dati o modificare l'user_id qui.
-- Per ora, usiamo un approccio che inserisce esercizi "default" (user_id = NULL)
-- che sono visibili a tutti gli utenti.

-- ============================================
-- ESERCIZI DEFAULT (visibili a tutti)
-- ============================================

INSERT INTO public.exercises (id, user_id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', NULL, 'Squat', 'Esercizio fondamentale per gambe e glutei. Piedi larghi quanto le spalle, scendi mantenendo il peso sui talloni.'),
  ('11111111-1111-1111-1111-111111111102', NULL, 'Panca Piana', 'Distensioni su panca con bilanciere o manubri. Lavora pettorali, deltoidi anteriori e tricipiti.'),
  ('11111111-1111-1111-1111-111111111103', NULL, 'Stacco da Terra', 'Deadlift classico. Fondamentale per catena posteriore: glutei, femorali, lombari.'),
  ('11111111-1111-1111-1111-111111111104', NULL, 'Trazioni alla Sbarra', 'Pull-up a presa prona. Lavora dorsali, bicipiti e core.'),
  ('11111111-1111-1111-1111-111111111105', NULL, 'Military Press', 'Distensioni sopra la testa con bilanciere o manubri. Lavora deltoidi e tricipiti.'),
  ('11111111-1111-1111-1111-111111111106', NULL, 'Affondi', 'Lunges frontali o camminati. Ottimi per quadricipiti e glutei.'),
  ('11111111-1111-1111-1111-111111111107', NULL, 'Plank', 'Isometria per il core. Mantieni la posizione con corpo allineato.'),
  ('11111111-1111-1111-1111-111111111108', NULL, 'Rematore con Bilanciere', 'Bent-over row. Lavora dorsali, romboidi e bicipiti.'),
  ('11111111-1111-1111-1111-111111111109', NULL, 'Curl con Manubri', 'Flessione avambracci per bicipiti. Esegui alternato o simultaneo.'),
  ('11111111-1111-1111-1111-111111111110', NULL, 'Dip alle Parallele', 'Lavora pettorali bassi e tricipiti. Inclinazione del busto modifica il focus.'),
  ('11111111-1111-1111-1111-111111111111', NULL, 'Leg Press', 'Pressa per gambe. Ottima alternativa allo squat per maggior carico.'),
  ('11111111-1111-1111-1111-111111111112', NULL, 'Crunch', 'Flessione del busto per addominali. Evita di tirare il collo.'),
  ('11111111-1111-1111-1111-111111111113', NULL, 'Cyclette', 'Riscaldamento cardio a bassa intensita. Ideale per warm-up.'),
  ('11111111-1111-1111-1111-111111111114', NULL, 'Stretching Flessori Anca', 'Allungamento per psoas e quadricipiti. Mantieni 30-60 secondi per lato.'),
  ('11111111-1111-1111-1111-111111111115', NULL, 'Cat-Cow', 'Mobilita per colonna vertebrale. Alterna flessione ed estensione in quadrupedia.');

-- ============================================
-- TAG ESERCIZI
-- ============================================

INSERT INTO public.exercise_tags (exercise_id, tag) VALUES
  -- Squat
  ('11111111-1111-1111-1111-111111111101', 'gambe'),
  ('11111111-1111-1111-1111-111111111101', 'glutei'),
  ('11111111-1111-1111-1111-111111111101', 'compound'),
  ('11111111-1111-1111-1111-111111111101', 'forza'),
  -- Panca Piana
  ('11111111-1111-1111-1111-111111111102', 'petto'),
  ('11111111-1111-1111-1111-111111111102', 'tricipiti'),
  ('11111111-1111-1111-1111-111111111102', 'compound'),
  ('11111111-1111-1111-1111-111111111102', 'push'),
  -- Stacco
  ('11111111-1111-1111-1111-111111111103', 'schiena'),
  ('11111111-1111-1111-1111-111111111103', 'glutei'),
  ('11111111-1111-1111-1111-111111111103', 'compound'),
  ('11111111-1111-1111-1111-111111111103', 'forza'),
  -- Trazioni
  ('11111111-1111-1111-1111-111111111104', 'dorsali'),
  ('11111111-1111-1111-1111-111111111104', 'bicipiti'),
  ('11111111-1111-1111-1111-111111111104', 'pull'),
  ('11111111-1111-1111-1111-111111111104', 'corpo-libero'),
  -- Military Press
  ('11111111-1111-1111-1111-111111111105', 'spalle'),
  ('11111111-1111-1111-1111-111111111105', 'tricipiti'),
  ('11111111-1111-1111-1111-111111111105', 'push'),
  -- Affondi
  ('11111111-1111-1111-1111-111111111106', 'gambe'),
  ('11111111-1111-1111-1111-111111111106', 'glutei'),
  ('11111111-1111-1111-1111-111111111106', 'equilibrio'),
  -- Plank
  ('11111111-1111-1111-1111-111111111107', 'core'),
  ('11111111-1111-1111-1111-111111111107', 'isometria'),
  ('11111111-1111-1111-1111-111111111107', 'corpo-libero'),
  -- Rematore
  ('11111111-1111-1111-1111-111111111108', 'dorsali'),
  ('11111111-1111-1111-1111-111111111108', 'schiena'),
  ('11111111-1111-1111-1111-111111111108', 'pull'),
  -- Curl
  ('11111111-1111-1111-1111-111111111109', 'bicipiti'),
  ('11111111-1111-1111-1111-111111111109', 'isolamento'),
  -- Dip
  ('11111111-1111-1111-1111-111111111110', 'petto'),
  ('11111111-1111-1111-1111-111111111110', 'tricipiti'),
  ('11111111-1111-1111-1111-111111111110', 'corpo-libero'),
  -- Leg Press
  ('11111111-1111-1111-1111-111111111111', 'gambe'),
  ('11111111-1111-1111-1111-111111111111', 'macchina'),
  -- Crunch
  ('11111111-1111-1111-1111-111111111112', 'addominali'),
  ('11111111-1111-1111-1111-111111111112', 'core'),
  -- Cyclette
  ('11111111-1111-1111-1111-111111111113', 'cardio'),
  ('11111111-1111-1111-1111-111111111113', 'riscaldamento'),
  -- Stretching
  ('11111111-1111-1111-1111-111111111114', 'stretching'),
  ('11111111-1111-1111-1111-111111111114', 'mobilita'),
  -- Cat-Cow
  ('11111111-1111-1111-1111-111111111115', 'mobilita'),
  ('11111111-1111-1111-1111-111111111115', 'riscaldamento'),
  ('11111111-1111-1111-1111-111111111115', 'schiena');

-- ============================================
-- NOTA PER DATI UTENTE-SPECIFICI
-- ============================================
-- Clienti, Palestre e Sessioni richiedono un user_id valido.
-- Dopo il primo login con Google, puoi inserire dati di test con:
--
-- 1. Trova il tuo user_id:
--    SELECT id FROM auth.users LIMIT 1;
--
-- 2. Inserisci dati di esempio sostituendo 'YOUR_USER_ID':
--
-- INSERT INTO public.clients (user_id, first_name, last_name, birth_date, gender, physical_notes)
-- VALUES ('YOUR_USER_ID', 'Mario', 'Rossi', '1985-03-15', 'M', 'Nessuna patologia. Leggera rigidita lombare.');
--
-- INSERT INTO public.gyms (user_id, name, address, description)
-- VALUES ('YOUR_USER_ID', 'Palestra Centro', 'Via Roma 123, Milano', 'Attrezzatura completa. Zona pesi, cardio e functional.');
