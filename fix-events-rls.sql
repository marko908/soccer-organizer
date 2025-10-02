-- Fix RLS policy for events table
-- Run this in Supabase SQL Editor

-- First, check current policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_condition,
  with_check AS with_check_condition
FROM pg_policies
WHERE tablename = 'events'
ORDER BY policyname;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users with permission can create events" ON events;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Create new policies
-- Allow anyone to view events
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
TO anon, authenticated
USING (true);

-- Allow users with can_create_events = true to create events
CREATE POLICY "Users with permission can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND can_create_events = true
  )
);

-- Allow users to update their own events
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
TO authenticated
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Allow users to delete their own events
CREATE POLICY "Users can delete own events"
ON events FOR DELETE
TO authenticated
USING (organizer_id = auth.uid());

-- Verify the new policies
SELECT
  policyname,
  cmd,
  roles,
  qual AS using_condition,
  with_check AS with_check_condition
FROM pg_policies
WHERE tablename = 'events'
ORDER BY policyname;
