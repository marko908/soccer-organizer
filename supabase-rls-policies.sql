-- =====================================================
-- FOOTHUB - Row Level Security (RLS) Policies
-- =====================================================
-- Run this in Supabase SQL Editor to enable RLS
-- Last updated: 2025-10-01
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ORGANIZERS TABLE POLICIES
-- =====================================================

-- Users can read their own organizer profile
CREATE POLICY "Users can view own profile"
ON organizers FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except role and approval status)
CREATE POLICY "Users can update own profile"
ON organizers FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM organizers WHERE id = auth.uid()) AND
  admin_approved = (SELECT admin_approved FROM organizers WHERE id = auth.uid())
);

-- Admins can view all organizers
CREATE POLICY "Admins can view all organizers"
ON organizers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admins can update any organizer (for approval workflow)
CREATE POLICY "Admins can update organizers"
ON organizers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Allow insert during registration (handled by Supabase Auth trigger)
CREATE POLICY "Allow organizer registration"
ON organizers FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. EVENTS TABLE POLICIES
-- =====================================================

-- Anyone can view events (public listing)
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
USING (true);

-- Approved organizers can create events
CREATE POLICY "Approved organizers can create events"
ON events FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND
  EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid()
    AND email_verified = true
    AND admin_approved = true
  )
);

-- Organizers can update their own events
CREATE POLICY "Organizers can update own events"
ON events FOR UPDATE
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- Organizers can delete their own events
CREATE POLICY "Organizers can delete own events"
ON events FOR DELETE
USING (auth.uid() = organizer_id);

-- =====================================================
-- 4. PARTICIPANTS TABLE POLICIES
-- =====================================================

-- Anyone can view participants (for event listings)
CREATE POLICY "Anyone can view participants"
ON participants FOR SELECT
USING (true);

-- Anyone can join an event (create participant record)
-- Note: Payment validation happens in application logic
CREATE POLICY "Anyone can join events"
ON participants FOR INSERT
WITH CHECK (true);

-- Event organizers can remove participants from their events
CREATE POLICY "Organizers can remove participants"
ON participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = participants.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Allow payment status updates (for Stripe webhooks using service_role key)
CREATE POLICY "Allow payment status updates"
ON participants FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. HELPER FUNCTIONS (OPTIONAL)
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is approved organizer
CREATE OR REPLACE FUNCTION is_approved_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizers
    WHERE id = auth.uid()
    AND email_verified = true
    AND admin_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON organizers TO anon, authenticated;
GRANT INSERT ON organizers TO authenticated;
GRANT UPDATE ON organizers TO authenticated;

GRANT SELECT ON events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON events TO authenticated;

GRANT SELECT ON participants TO anon, authenticated;
GRANT INSERT ON participants TO anon, authenticated;
GRANT DELETE ON participants TO authenticated;
GRANT UPDATE ON participants TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify RLS is enabled:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';
-- =====================================================
