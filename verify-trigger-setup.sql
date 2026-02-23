-- ENSURE TRIGGER WORKS FOR FUTURE SIGNUPS
-- Run this AFTER fixing orphaned users
-- ============================================================================

-- Check if trigger exists
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger MISSING'
  END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  'Function Status' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Function EXISTS'
    ELSE '❌ Function MISSING'
  END as status
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- If either is missing, recreate them:
-- DROP AND RECREATE TRIGGER AND FUNCTION
-- UNCOMMENT TO RUN:
/*
-- Recreate function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_username text;
  meta_full_name text;
BEGIN
  meta_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  meta_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');

  INSERT INTO public.users (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(meta_username, SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(meta_full_name, SPLIT_PART(NEW.email, '@', 1))
  );

  INSERT INTO public.wallets (user_id, httn_points)
  VALUES (NEW.id, 100);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');

  INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
  VALUES
    (NEW.id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
    (NEW.id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
    (NEW.id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
    (NEW.id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Trigger and function recreated successfully' as result;
*/
