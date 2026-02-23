-- Run this in Supabase SQL Editor to diagnose 400 errors
-- ============================================================================

-- STEP 1: Check if users is a TABLE or VIEW
SELECT 
  table_type,
  CASE 
    WHEN table_type = 'BASE TABLE' THEN '✅ GOOD: users is a table'
    WHEN table_type = 'VIEW' THEN '❌ PROBLEM: users is a view (should be a table!)'
  END as diagnosis
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- STEP 2: Check columns in users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- STEP 3: Check RLS policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- STEP 4: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '⚠️  RLS is ON - policies control access'
    ELSE '✅ RLS is OFF - all users can access'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- STEP 5: Test query as anonymous user (what your app uses for unauthenticated queries)
-- This shows what data is visible without authentication
SET ROLE anon;
SELECT COUNT(*) as visible_users_count FROM users;
RESET ROLE;

-- STEP 6: If users is still a VIEW, drop it and verify the table
-- UNCOMMENT ONLY IF STEP 1 SHOWS IT'S A VIEW:
/*
DROP VIEW IF EXISTS public.users CASCADE;
-- Check if profiles table exists and needs to be renamed
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';
*/

-- STEP 7: Solution - Add/Update RLS policies for public access
-- UNCOMMENT TO FIX ACCESS ISSUES:
/*
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user profiles (public data)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" 
  ON public.users FOR SELECT 
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = user_id);
*/
