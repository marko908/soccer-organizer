-- Automatically grant can_create_events to ADMIN users
-- Run this in Supabase SQL Editor

-- First, update all existing admins to have can_create_events = true
UPDATE users
SET can_create_events = true
WHERE role = 'ADMIN' AND can_create_events = false;

-- Create a function that automatically sets can_create_events = true for admins
CREATE OR REPLACE FUNCTION auto_grant_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is ADMIN, automatically grant can_create_events
  IF NEW.role = 'ADMIN' THEN
    NEW.can_create_events := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS ensure_admin_can_create_events ON users;

-- Create trigger that runs before INSERT or UPDATE
CREATE TRIGGER ensure_admin_can_create_events
  BEFORE INSERT OR UPDATE OF role
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_admin_permissions();

-- Verify all admins now have permission
SELECT id, email, nickname, role, can_create_events
FROM users
WHERE role = 'ADMIN';
