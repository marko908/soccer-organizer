-- Fix: Remove old 'name' column constraint or drop it entirely

-- Option 1: Check if 'name' column exists and what its constraints are
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('name', 'full_name');

-- Option 2: If 'name' column still exists, either:
-- A) Drop it (recommended if we're using full_name now)
ALTER TABLE users DROP COLUMN IF EXISTS name;

-- B) Or make it nullable and set a default
-- ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
-- ALTER TABLE users ALTER COLUMN name SET DEFAULT '';

-- Verify the change
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('name', 'full_name', 'nickname', 'email')
ORDER BY column_name;
