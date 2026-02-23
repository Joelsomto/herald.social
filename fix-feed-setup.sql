-- Comprehensive Feed setup check and fix
-- ============================================================================

-- STEP 1: Verify posts table has author_id foreign key pointing to users
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name = 'posts' 
  AND column_name = 'author_id';

-- Also check the actual constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.posts'::regclass::oid
  AND conname LIKE '%author%';

-- STEP 2: Check RLS policies on posts table
SELECT policyname, permissive, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;

-- STEP 3: Check RLS policies on users table
SELECT policyname, permissive, cmd, roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- STEP 4: List all posts with authors
SELECT 
  p.id,
  p.content,
  p.author_id,
  u.username,
  u.display_name,
  p.created_at
FROM posts p
LEFT JOIN users u ON p.author_id = u.user_id
ORDER BY p.created_at DESC
LIMIT 10;

-- STEP 5: Check if RLS is enabled on posts
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'posts';

-- STEP 6: Enable RLS and set up proper policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

-- Allow authenticated users to create posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Allow users to delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- STEP 7: Enable RLS on users table for foreign key join
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view user profiles
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON public.users;
CREATE POLICY "User profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- STEP 8: Verify posts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts'
ORDER BY ordinal_position;

SELECT '✅ Feed database setup verified and fixed' as result;
