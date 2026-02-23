-- Fix missing updated_at column
-- ============================================================================

-- Step 1: Add the missing updated_at column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Now update the trigger function
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

  INSERT INTO public.users (id, user_id, username, display_name, full_name)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(meta_username, SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(meta_full_name, SPLIT_PART(NEW.email, '@', 1)),
    meta_full_name
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

-- Step 3: Update existing users' full_name from display_name
UPDATE public.users 
SET full_name = display_name 
WHERE full_name IS NULL AND display_name IS NOT NULL;

SELECT '✅ Fixed updated_at column, updated trigger, and fixed existing users' as result;
