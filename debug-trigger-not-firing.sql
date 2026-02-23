-- DEBUG: Check why profiles aren't being created
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check if trigger exists
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- STEP 2: Check if handle_new_user function exists
SELECT 
  routine_name,
  routine_schema,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- STEP 3: See function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- STEP 4: Check for orphaned auth users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'username' as username,
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE 
    WHEN u.user_id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- STEP 5: Check if public.users table has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- STEP 6: Test the function manually (replace 'your-user-id' with actual auth user id)
-- UNCOMMENT AND RUN THIS TO MANUALLY CREATE PROFILE FOR ORPHANED USER:
/*
DO $$
DECLARE
  orphaned_user_id uuid;
  orphaned_email text;
  meta_username text;
  meta_full_name text;
BEGIN
  -- Get first orphaned user
  SELECT au.id, au.email 
  INTO orphaned_user_id, orphaned_email
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.user_id
  WHERE u.user_id IS NULL
  LIMIT 1;

  IF orphaned_user_id IS NOT NULL THEN
    -- Get metadata
    SELECT 
      raw_user_meta_data->>'username',
      raw_user_meta_data->>'full_name'
    INTO meta_username, meta_full_name
    FROM auth.users
    WHERE id = orphaned_user_id;

    -- Create profile
    INSERT INTO public.users (user_id, username, display_name)
    VALUES (
      orphaned_user_id,
      COALESCE(NULLIF(TRIM(meta_username), ''), SPLIT_PART(orphaned_email, '@', 1)),
      COALESCE(NULLIF(TRIM(meta_full_name), ''), SPLIT_PART(orphaned_email, '@', 1))
    );

    -- Create wallet
    INSERT INTO public.wallets (user_id, httn_points)
    VALUES (orphaned_user_id, 100);

    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (orphaned_user_id, 'participant');

    -- Create tasks
    INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
    VALUES
      (orphaned_user_id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
      (orphaned_user_id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
      (orphaned_user_id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
      (orphaned_user_id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20);

    -- Create settings if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
      INSERT INTO public.user_settings (user_id) VALUES (orphaned_user_id);
    END IF;

    RAISE NOTICE 'Profile created for user: %', orphaned_email;
  ELSE
    RAISE NOTICE 'No orphaned users found';
  END IF;
END $$;
*/

-- STEP 7: Re-create the trigger (in case it's missing)
-- UNCOMMENT TO FIX:
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
