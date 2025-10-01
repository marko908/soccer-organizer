-- Fix RLS policies to allow user registration
-- This allows users to create their own profile during signup

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Recreate policies with INSERT permission for registration

-- 1. Users can INSERT their own profile during registration
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 4. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 5. Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
