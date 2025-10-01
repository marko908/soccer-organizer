-- =====================================================
-- FOOTHUB - RLS Policy Fix (Force Drop and Recreate)
-- =====================================================
-- Run this to forcefully update RLS policies
-- =====================================================

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY
-- =====================================================
ALTER TABLE organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP ALL EXISTING POLICIES
-- =====================================================

-- Organizers policies
DROP POLICY IF EXISTS "Users can view own profile" ON organizers;
DROP POLICY IF EXISTS "Users can update own profile" ON organizers;
DROP POLICY IF EXISTS "Admins can view all organizers" ON organizers;
DROP POLICY IF EXISTS "Admins can update organizers" ON organizers;
DROP POLICY IF EXISTS "Admins can update any user" ON organizers;
DROP POLICY IF EXISTS "Allow organizer registration" ON organizers;
DROP POLICY IF EXISTS "Allow user registration" ON organizers;

-- Events policies
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Approved organizers can create events" ON events;
DROP POLICY IF EXISTS "Users with permission can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update own events" ON events;
DROP POLICY IF EXISTS "Creators can update own events" ON events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON events;
DROP POLICY IF EXISTS "Creators can delete own events" ON events;

-- =====================================================
-- 3. CREATE NEW POLICIES
-- =====================================================

-- ORGANIZERS TABLE POLICIES

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON organizers FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON organizers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Users can update their own profile (except role and can_create_events)
CREATE POLICY "Users can update own profile"
ON organizers FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM organizers WHERE id = auth.uid()) AND
  can_create_events = (SELECT can_create_events FROM organizers WHERE id = auth.uid())
);

-- Admins can update any user (including permissions and role)
CREATE POLICY "Admins can update any user"
ON organizers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Allow insert during registration
CREATE POLICY "Allow user registration"
ON organizers FOR INSERT
WITH CHECK (auth.uid() = id);

-- EVENTS TABLE POLICIES

-- Anyone can view events (public listing)
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
USING (true);

-- Users with can_create_events permission can create events
CREATE POLICY "Users with permission can create events"
ON events FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid()
    AND email_verified = true
    AND can_create_events = true
  )
);

-- Event creators can update their own events
CREATE POLICY "Creators can update own events"
ON events FOR UPDATE
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- Event creators can delete their own events
CREATE POLICY "Creators can delete own events"
ON events FOR DELETE
USING (auth.uid() = organizer_id);

-- =====================================================
-- 4. RE-ENABLE RLS
-- =====================================================
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. UPDATE HELPER FUNCTIONS
-- =====================================================

-- Drop old function
DROP FUNCTION IF EXISTS is_approved_organizer();

-- Function to check if user can create events
CREATE OR REPLACE FUNCTION can_create_events()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid()
    AND email_verified = true
    AND can_create_events = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('organizers', 'events')
-- ORDER BY tablename, policyname;
