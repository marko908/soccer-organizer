-- Clean up duplicate and old policies on users table

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;

-- Drop old/duplicate policies with different names
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Create clean set of policies

-- 1. INSERT: Users can create their own profile during registration
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. SELECT: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 5. UPDATE: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Verify - should show exactly 5 policies
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
