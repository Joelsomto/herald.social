-- Create a database function to create notifications when someone comments
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  commenter_name text;
  commenter_username text;
  commenter_avatar text;
  commenter_verified boolean;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter info
  SELECT display_name, username, avatar_url, is_verified 
  INTO commenter_name, commenter_username, commenter_avatar, commenter_verified
  FROM public.profiles 
  WHERE user_id = NEW.author_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    actor_name,
    actor_avatar,
    actor_verified,
    reference_id,
    reference_type
  ) VALUES (
    post_author_id,
    'comment',
    'New Comment',
    COALESCE(commenter_name, 'Someone') || ' commented on your post',
    NEW.author_id,
    commenter_name,
    commenter_avatar,
    commenter_verified,
    NEW.post_id,
    'post'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_notification();

-- Update the follow notification to include more actor info
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  follower_name text;
  follower_username text;
  follower_avatar text;
  follower_verified boolean;
BEGIN
  -- Get follower info
  SELECT display_name, username, avatar_url, is_verified 
  INTO follower_name, follower_username, follower_avatar, follower_verified
  FROM public.profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    actor_name,
    actor_avatar,
    actor_verified,
    reference_id,
    reference_type
  ) VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    COALESCE(follower_name, 'Someone') || ' started following you',
    NEW.follower_id,
    follower_name,
    follower_avatar,
    follower_verified,
    NEW.follower_id,
    'profile'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for follow notifications
DROP TRIGGER IF EXISTS on_follow_created ON public.followers;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();

-- Create user_interests table for onboarding
CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interests text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests"
  ON public.user_interests FOR UPDATE
  USING (auth.uid() = user_id);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  summary text,
  content text,
  source text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('herald', 'loveworld', 'external')),
  image_url text,
  external_url text,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Anyone can view news articles"
  ON public.news_articles FOR SELECT
  USING (true);

-- Create live_streams table
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  stream_url text,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('live', 'offline', 'scheduled')),
  viewer_count integer DEFAULT 0,
  scheduled_for timestamp with time zone,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view live streams"
  ON public.live_streams FOR SELECT
  USING (true);

CREATE POLICY "Users can create own streams"
  ON public.live_streams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streams"
  ON public.live_streams FOR UPDATE
  USING (auth.uid() = user_id);

-- Create orders table for E-Store
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total_amount integer NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('httn', 'espees')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);