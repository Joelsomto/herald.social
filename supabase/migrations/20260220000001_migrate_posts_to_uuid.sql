-- Optional Migration: Convert posts.id from INTEGER to UUID
-- UUID is better for:
-- 1. Security (no sequential IDs that reveal information)
-- 2. Scalability (works better in distributed systems)
-- 3. No collisions across databases
-- 4. Better for replication
--
-- WARNING: This migration will:
-- - Create a new UUID column
-- - Migrate all foreign key references
-- - Drop the old INTEGER column
-- - Requires downtime and data migration
--
-- Only run this if you want to migrate from INTEGER to UUID
-- If your posts table already uses UUID, this migration will be skipped

DO $$
DECLARE
  posts_id_type TEXT;
BEGIN
  -- Check if posts table exists and has INTEGER id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) THEN
    SELECT data_type INTO posts_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'id';

    -- Only migrate if posts.id is INTEGER
    IF posts_id_type IN ('integer', 'bigint', 'smallint') THEN
      -- Step 1: Add new UUID column
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid();
      
      -- Step 2: Update id_new with unique UUIDs for existing rows
      UPDATE public.posts SET id_new = gen_random_uuid() WHERE id_new IS NULL;
      
      -- Step 3: Make id_new NOT NULL
      ALTER TABLE public.posts ALTER COLUMN id_new SET NOT NULL;
      
      -- Step 3b: Add UNIQUE on id_new so FKs can reference it before we make it the primary key
      ALTER TABLE public.posts ADD CONSTRAINT posts_id_new_key UNIQUE (id_new);
      
      -- Step 4: Update foreign key references in post_interactions
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'post_interactions'
      ) THEN
        -- Add temporary UUID column to post_interactions
        ALTER TABLE public.post_interactions ADD COLUMN IF NOT EXISTS post_id_uuid UUID;
        
        -- Map old INTEGER ids to new UUIDs
        UPDATE public.post_interactions pi
        SET post_id_uuid = p.id_new
        FROM public.posts p
        WHERE pi.post_id = p.id::text::integer;
        
        -- Drop old foreign key constraint
        ALTER TABLE public.post_interactions DROP CONSTRAINT IF EXISTS post_interactions_post_id_fkey;
        
        -- Drop old INTEGER column
        ALTER TABLE public.post_interactions DROP COLUMN IF EXISTS post_id;
        
        -- Rename UUID column
        ALTER TABLE public.post_interactions RENAME COLUMN post_id_uuid TO post_id;
        
        -- Add new foreign key constraint
        ALTER TABLE public.post_interactions
        ADD CONSTRAINT post_interactions_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
      END IF;

      -- Step 4b: Migrate comments.post_id from INTEGER to UUID (before dropping posts.id)
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'comments'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'post_id'
            AND data_type IN ('integer', 'bigint', 'smallint')
        ) THEN
          ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS post_id_uuid UUID;
          UPDATE public.comments c
          SET post_id_uuid = p.id_new
          FROM public.posts p
          WHERE c.post_id = p.id;
          ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
          ALTER TABLE public.comments DROP COLUMN IF EXISTS post_id;
          ALTER TABLE public.comments RENAME COLUMN post_id_uuid TO post_id;
          ALTER TABLE public.comments
          ADD CONSTRAINT comments_post_id_fkey
          FOREIGN KEY (post_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
        END IF;
      END IF;

      -- Step 4c: Migrate posts.parent_id to UUID (self-FK) so we can drop posts_pkey
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'parent_id') THEN
        ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_parent_id_fkey;
        ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS parent_id_new UUID;
        UPDATE public.posts p SET parent_id_new = q.id_new FROM public.posts q WHERE p.parent_id::text = q.id::text;
        ALTER TABLE public.posts DROP COLUMN IF EXISTS parent_id;
        ALTER TABLE public.posts RENAME COLUMN parent_id_new TO parent_id;
        ALTER TABLE public.posts ADD CONSTRAINT posts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
      END IF;

      -- Step 4d: Migrate likes.post_id to UUID
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_post_id_fkey;
        ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS post_id_uuid UUID;
        UPDATE public.likes l SET post_id_uuid = p.id_new FROM public.posts p WHERE l.post_id::text = p.id::text;
        ALTER TABLE public.likes DROP COLUMN IF EXISTS post_id;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'likes' AND column_name = 'post_id_uuid') THEN
          ALTER TABLE public.likes RENAME COLUMN post_id_uuid TO post_id;
          ALTER TABLE public.likes ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
        END IF;
      END IF;

      -- Step 4e: Migrate reposts.original_post_id to UUID
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reposts') THEN
        ALTER TABLE public.reposts DROP CONSTRAINT IF EXISTS reposts_original_post_id_fkey;
        ALTER TABLE public.reposts ADD COLUMN IF NOT EXISTS original_post_id_uuid UUID;
        UPDATE public.reposts r SET original_post_id_uuid = p.id_new FROM public.posts p WHERE r.original_post_id::text = p.id::text;
        ALTER TABLE public.reposts DROP COLUMN IF EXISTS original_post_id;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reposts' AND column_name = 'original_post_id_uuid') THEN
          ALTER TABLE public.reposts RENAME COLUMN original_post_id_uuid TO original_post_id;
          ALTER TABLE public.reposts ADD CONSTRAINT reposts_original_post_id_fkey FOREIGN KEY (original_post_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
        END IF;
      END IF;

      -- Step 4f: Migrate post_hashtags.post_id to UUID
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_hashtags') THEN
        ALTER TABLE public.post_hashtags DROP CONSTRAINT IF EXISTS post_hashtags_post_id_fkey;
        ALTER TABLE public.post_hashtags ADD COLUMN IF NOT EXISTS post_id_uuid UUID;
        UPDATE public.post_hashtags ph SET post_id_uuid = p.id_new FROM public.posts p WHERE ph.post_id::text = p.id::text;
        ALTER TABLE public.post_hashtags DROP COLUMN IF EXISTS post_id;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'post_hashtags' AND column_name = 'post_id_uuid') THEN
          ALTER TABLE public.post_hashtags RENAME COLUMN post_id_uuid TO post_id;
          ALTER TABLE public.post_hashtags ADD CONSTRAINT post_hashtags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id_new) ON DELETE CASCADE;
        END IF;
      END IF;
      
      -- Step 5: Drop old INTEGER column from posts (all FKs now reference id_new)
      ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_pkey;
      ALTER TABLE public.posts DROP COLUMN IF EXISTS id;
      
      -- Step 6: Rename id_new to id and make it primary key
      -- (Keep posts_id_new_key; FKs depend on it and dropping would require dropping all FKs first.)
      ALTER TABLE public.posts RENAME COLUMN id_new TO id;
      ALTER TABLE public.posts ADD PRIMARY KEY (id);
      
      RAISE NOTICE 'Successfully migrated posts.id from INTEGER to UUID';
    ELSE
      RAISE NOTICE 'posts.id is already UUID or different type, skipping migration';
    END IF;
  ELSE
    RAISE NOTICE 'posts table does not exist, skipping migration';
  END IF;
END $$;
