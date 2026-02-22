-- Point posts.author_id to public.users(user_id) so PostgREST can resolve
-- author:users!posts_author_id_fkey (embed author profile in posts query).
-- Backfill public.users for any post authors that don't have a row yet, then add the FK.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'author_id') THEN
    -- Backfill: insert a users row for each distinct posts.author_id that is missing.
    -- Use author_id for both id and user_id so no FK (e.g. self-reference on users.id) is violated.
    INSERT INTO public.users (id, user_id, display_name, username)
    SELECT DISTINCT p.author_id, p.author_id, 'User', 'user_' || replace(p.author_id::text, '-', '')
    FROM public.posts p
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = p.author_id)
    ON CONFLICT (user_id) DO NOTHING;

    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;
END $$;
