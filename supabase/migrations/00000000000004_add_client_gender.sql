-- Add optional gender field to clients table
ALTER TABLE clients ADD COLUMN gender text CHECK (gender IN ('male', 'female'));

-- Add comment for documentation
COMMENT ON COLUMN clients.gender IS 'Optional client gender: male or female. Used for AI training plan context.';
