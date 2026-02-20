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
      
      -- Step 5: Drop old INTEGER column from posts
      ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_pkey;
      ALTER TABLE public.posts DROP COLUMN IF EXISTS id;
      
      -- Step 6: Rename id_new to id and make it primary key
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
