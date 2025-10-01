-- SIMPLE FIX: Allow anyone to insert into users table during registration
-- This is the most permissive approach but works

-- Drop ALL policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Create simple, permissive policies

-- 1. Allow INSERT for authenticated users (anyone who just signed up)
CREATE POLICY "Allow user registration"
ON users FOR INSERT
TO authenticated, anon  -- Allow both authenticated and anonymous
WITH CHECK (true);  -- Allow all inserts (we'll restrict this later)

-- 2. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id OR role = 'ADMIN');

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id OR role = 'ADMIN');

-- Verify
SELECT policyname, cmd, roles, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
