-- Rename users table to users
-- This script renames the users table and updates all related constraints and references

-- Step 1: Disable RLS temporarily
ALTER TABLE organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies (we'll recreate them later)
DROP POLICY IF EXISTS "Users can view own profile" ON organizers;
DROP POLICY IF EXISTS "Users can update own profile" ON organizers;
DROP POLICY IF EXISTS "Admins can view all profiles" ON organizers;
DROP POLICY IF EXISTS "Admins can update all profiles" ON organizers;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Users with permission can create events" ON events;
DROP POLICY IF EXISTS "Event creators can update their events" ON events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON events;
DROP POLICY IF EXISTS "Anyone can view participants" ON participants;
DROP POLICY IF EXISTS "Anyone can join events" ON participants;
DROP POLICY IF EXISTS "Event creators can remove participants" ON participants;

-- Step 3: Rename the table
ALTER TABLE organizers RENAME TO users;

-- Step 4: Update foreign key references
-- Note: PostgreSQL automatically updates constraint names when renaming tables,
-- but we need to ensure column references are correct

-- The foreign key in events table
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
ALTER TABLE events ADD CONSTRAINT events_organizer_id_fkey
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE;

-- The foreign key in participants table (if exists)
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_user_id_fkey;
ALTER TABLE participants ADD CONSTRAINT participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 5: Rename indexes
ALTER INDEX IF EXISTS organizers_pkey RENAME TO users_pkey;
ALTER INDEX IF EXISTS organizers_email_key RENAME TO users_email_key;
ALTER INDEX IF EXISTS organizers_nickname_unique RENAME TO users_nickname_unique;

-- Step 6: Recreate RLS policies with new table name
-- Users table policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update all profiles"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Events table policies
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users with permission can create events"
ON events FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND email_verified = true
    AND can_create_events = true
  )
);

CREATE POLICY "Event creators can update their events"
ON events FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Event creators can delete their events"
ON events FOR DELETE
USING (auth.uid() = organizer_id);

-- Participants table policies
CREATE POLICY "Anyone can view participants"
ON participants FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Anyone can join events"
ON participants FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Event creators can remove participants"
ON participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = participants.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Step 7: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Step 8: Update helper functions (if they exist)
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS is_approved_organizer();
CREATE OR REPLACE FUNCTION is_approved_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND email_verified = true
    AND can_create_events = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification query - check if rename was successful
SELECT
  'users' as table_name,
  count(*) as total_rows
FROM users;
