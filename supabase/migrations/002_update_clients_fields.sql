-- Update clients table with new fields
-- Run this in Supabase SQL Editor
-- NON-DESTRUCTIVE: preserves existing data

-- Step 1: Add new columns (IF NOT EXISTS to be idempotent)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS age_years integer;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS physical_notes text;

-- Step 2: Migrate data from old 'name' column to new columns (if name exists and has data)
-- Split name by first space: first part -> first_name, rest -> last_name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
    UPDATE public.clients
    SET
      first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
      last_name = COALESCE(last_name,
        CASE
          WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
          ELSE ''
        END
      )
    WHERE first_name IS NULL OR last_name IS NULL;
  END IF;
END $$;

-- Step 3: Migrate old 'notes' to 'physical_notes' if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes') THEN
    UPDATE public.clients
    SET physical_notes = COALESCE(physical_notes, notes)
    WHERE physical_notes IS NULL AND notes IS NOT NULL;
  END IF;
END $$;

-- Step 4: Set defaults for new required columns where NULL
UPDATE public.clients SET first_name = 'Nome' WHERE first_name IS NULL OR first_name = '';
UPDATE public.clients SET last_name = 'Cognome' WHERE last_name IS NULL OR last_name = '';
UPDATE public.clients SET age_years = 30 WHERE birth_date IS NULL AND age_years IS NULL;

-- Step 5: Now make columns NOT NULL
ALTER TABLE public.clients ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN last_name SET NOT NULL;

-- Step 6: Add check constraints (drop first if exist to avoid errors)
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS birth_date_or_age_required;
ALTER TABLE public.clients ADD CONSTRAINT birth_date_or_age_required
  CHECK (birth_date IS NOT NULL OR age_years IS NOT NULL);

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS age_years_positive;
ALTER TABLE public.clients ADD CONSTRAINT age_years_positive
  CHECK (age_years IS NULL OR age_years > 0);

-- NOTE: Old columns (name, email, phone, notes) are preserved.
-- You can manually drop them later after verifying data migration:
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS name;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS email;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS phone;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS notes;
