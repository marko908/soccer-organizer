-- =====================================================
-- FOOTHUB - Updated Row Level Security (RLS) Policies
-- =====================================================
-- Run this AFTER running supabase-migration-user-profiles.sql
-- This updates policies to use new permission system
-- Last updated: 2025-10-01
-- =====================================================

-- =====================================================
-- DROP OLD POLICIES THAT NEED TO BE REPLACED
-- =====================================================

-- Drop all existing organizers policies
DROP POLICY IF EXISTS "Users can view own profile" ON organizers;
DROP POLICY IF EXISTS "Users can update own profile" ON organizers;
DROP POLICY IF EXISTS "Admins can view all organizers" ON organizers;
DROP POLICY IF EXISTS "Admins can update organizers" ON organizers;
DROP POLICY IF EXISTS "Allow organizer registration" ON organizers;

-- Drop old events policies
DROP POLICY IF EXISTS "Approved organizers can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update own events" ON events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON events;

-- =====================================================
-- RECREATE ORGANIZERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON organizers FOR SELECT
USING (auth.uid() = id);

-- Admins can view all organizers
CREATE POLICY "Admins can view all organizers"
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

-- Allow insert during registration (handled by Supabase Auth)
CREATE POLICY "Allow user registration"
ON organizers FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- RECREATE EVENTS TABLE POLICIES
-- =====================================================

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
-- UPDATED HELPER FUNCTIONS
-- =====================================================

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

-- Update existing function
DROP FUNCTION IF EXISTS is_approved_organizer();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check users with create_events permission
-- SELECT id, email, full_name, nickname, can_create_events, role
-- FROM organizers
-- WHERE can_create_events = true;

-- Check all active policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
