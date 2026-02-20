-- Add verification badge system columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_points_threshold integer DEFAULT 10000,
ADD COLUMN IF NOT EXISTS total_engagement integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Create user_analytics table for AI-powered behavior tracking
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create ad_campaigns table for points-based advertising
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_audience jsonb DEFAULT '{}',
  budget_points integer NOT NULL DEFAULT 0,
  spent_points integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create followers table for social connections
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  dark_mode boolean DEFAULT true,
  privacy_level text DEFAULT 'public',
  language text DEFAULT 'en',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_analytics
CREATE POLICY "Users can insert own analytics" ON public.user_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for ad_campaigns
CREATE POLICY "Users can view own campaigns" ON public.ad_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.ad_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.ad_campaigns FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for followers
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Function to check and update verification status
CREATE OR REPLACE FUNCTION public.check_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user meets verification threshold (10,000 points + 100 engagement)
  IF NEW.total_engagement >= 100 THEN
    -- Get wallet points
    DECLARE
      wallet_points integer;
    BEGIN
      SELECT httn_points INTO wallet_points FROM public.wallets WHERE user_id = NEW.user_id;
      IF wallet_points >= 10000 THEN
        NEW.is_verified := true;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-verification
DROP TRIGGER IF EXISTS check_verification_trigger ON public.profiles;
CREATE TRIGGER check_verification_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_verification_status();

-- Update handle_new_user to also create settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
  
  -- Create wallet with welcome bonus
  INSERT INTO public.wallets (user_id, httn_points)
  VALUES (NEW.id, 100);
  
  -- Assign default participant role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create initial daily tasks
  INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
  VALUES 
    (NEW.id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
    (NEW.id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
    (NEW.id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
    (NEW.id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20);
  
  RETURN NEW;
END;
$$;