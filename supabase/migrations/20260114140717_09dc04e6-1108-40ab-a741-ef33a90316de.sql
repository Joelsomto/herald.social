-- Create comments table for post replies (post_id type matches posts.id for compatibility)
DO $$
DECLARE
  posts_id_type text;
  create_sql text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comments'
  ) THEN
    SELECT data_type INTO posts_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id';

    IF posts_id_type IS NULL THEN
      RAISE EXCEPTION 'posts.id not found; run base migrations first';
    END IF;

    create_sql := format(
      'CREATE TABLE public.comments (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id %s NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL,
        parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        likes_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )',
      posts_id_type
    );
    EXECUTE create_sql;
  END IF;
END $$;

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;
CREATE POLICY "Users can create own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- Add realtime for comments (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_comment_id);
