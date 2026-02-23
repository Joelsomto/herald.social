-- Run this directly in your Supabase SQL Editor to fix the database immediately
-- ============================================================================

-- Step 1: Verify current state
SELECT 
  table_type,
  CASE 
    WHEN table_type = 'BASE TABLE' THEN '✅ Correct - users is a TABLE'
    WHEN table_type = 'VIEW' THEN '❌ Problem - users is a VIEW'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- Step 2: Check trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  '✅ Trigger exists' as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 3: List all users in database
SELECT 
  user_id,
  username,
  display_name,
  email,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: If no users exist, check auth.users for orphaned accounts
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.user_id IS NULL THEN '❌ No profile created'
    ELSE '✅ Profile exists'
  END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- Step 5: OPTIONAL - If you have orphaned auth users, run this to create their profiles:
-- UNCOMMENT TO RUN:
/*
-- Create missing profiles
INSERT INTO public.users (user_id, username, display_name)
SELECT 
  id, 
  email,
  SPLIT_PART(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.users);

-- Create missing wallets
INSERT INTO public.wallets (user_id, httn_points)
SELECT id, 100 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets);

-- Assign missing roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'participant'::app_role FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);
*/

-- Step 6: Verify fix
SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT 
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as missing_profiles;
