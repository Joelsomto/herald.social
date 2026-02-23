-- FIX: Create profiles for all orphaned auth users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Create profiles for all orphaned auth users
DO $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Loop through all auth users without profiles
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data->>'username' as meta_username,
      au.raw_user_meta_data->>'full_name' as meta_full_name
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.user_id
    WHERE u.user_id IS NULL
  LOOP
    BEGIN
      -- Create profile
      INSERT INTO public.users (id, user_id, username, display_name)
      VALUES (
        gen_random_uuid(),
        user_record.id,
        COALESCE(NULLIF(TRIM(user_record.meta_username), ''), SPLIT_PART(user_record.email, '@', 1)),
        COALESCE(NULLIF(TRIM(user_record.meta_full_name), ''), SPLIT_PART(user_record.email, '@', 1))
      );

      -- Create wallet
      INSERT INTO public.wallets (user_id, httn_points)
      VALUES (user_record.id, 100)
      ON CONFLICT (user_id) DO NOTHING;

      -- Assign role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (user_record.id, 'participant')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Create tasks
      INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
      VALUES
        (user_record.id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
        (user_record.id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
        (user_record.id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
        (user_record.id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20)
      ON CONFLICT (user_id, task_type, title) DO NOTHING;

      -- Create settings
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
        INSERT INTO public.user_settings (user_id) VALUES (user_record.id)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;

      created_count := created_count + 1;
      RAISE NOTICE 'Created profile for: %', user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create profile for %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Total profiles created: %', created_count;
END $$;

-- STEP 2: Verify all users now have profiles
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users u ON au.id = u.user_id WHERE u.user_id IS NULL) as orphaned_users;

-- STEP 3: List all users with their profile status
SELECT 
  au.id,
  au.email,
  u.username,
  u.display_name,
  CASE 
    WHEN u.user_id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
ORDER BY au.created_at DESC;
