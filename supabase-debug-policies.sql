-- Debug: Check what's actually blocking the INSERT

-- 1. Check all policies with their actual conditions
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
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- 3. Test if auth.uid() is working (run this after registering)
-- SELECT auth.uid();

-- 4. Check if there are any INSERT policies that allow the operation
SELECT
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'INSERT';
