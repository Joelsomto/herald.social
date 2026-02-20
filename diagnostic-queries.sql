-- ============================================
-- DIAGNOSTIC QUERIES FOR USER DATABASE
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check trigger function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. Check auth.users (if you have access)
-- Note: This might not work with anon key, but try it
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
LIMIT 10;

-- 4. Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check if profiles table exists and is accessible
SELECT COUNT(*) as profile_count FROM profiles;

-- 6. Check wallets table
SELECT COUNT(*) as wallet_count FROM wallets;

-- 7. Check user_roles table
SELECT COUNT(*) as roles_count FROM user_roles;

-- 8. Check user_settings table
SELECT COUNT(*) as settings_count FROM user_settings;

-- 9. Check user_tasks table
SELECT COUNT(*) as tasks_count FROM user_tasks;

-- 10. Check all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 11. Check if RLS is enabled on profiles
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 12. Check RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
