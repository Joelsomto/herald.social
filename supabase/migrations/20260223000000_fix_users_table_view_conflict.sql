-- Fix any conflicts between public.users view and table
-- This ensures the TABLE exists and the VIEW does not

-- 1. Drop the view if it exists (it should have been dropped already, but ensure it's gone)
-- Check if it's a view first, only drop if it is
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    DROP VIEW public.users CASCADE;
  END IF;
END $$;

-- 2. Verify the table exists (it should have been renamed from profiles)
-- If for some reason profiles still exists and users doesn't, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE public.profiles RENAME TO users;
  END IF;
END $$;

-- 3. Ensure the handle_new_user trigger is correctly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify trigger function exists and uses correct table name
-- (This is just a safety check, the function should already exist from previous migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
  ) THEN
    RAISE EXCEPTION 'handle_new_user function does not exist. Please run earlier migrations first.';
  END IF;
END $$;

COMMENT ON TABLE public.users IS 'Application user profiles and data. NOT a view - this is the actual table (previously named profiles).';
