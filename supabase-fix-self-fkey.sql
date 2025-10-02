-- Fix: Remove self-referencing foreign key constraint from users table
-- This is a leftover from the organizers -> users rename

-- Check what foreign key constraints exist on users table
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND contype = 'f';

-- Drop the problematic constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS organizers_id_fkey;

-- Verify it's gone
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND contype = 'f';
