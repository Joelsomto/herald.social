-- Add account_type to profiles for Normal, Church/Group, and Business accounts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'normal' CHECK (account_type IN ('normal', 'church', 'business'));

-- Add a column for church/organization name when applicable
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_name text;

-- Add a column for business info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_category text;

-- Create a table for communities
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  created_by uuid NOT NULL,
  member_count integer DEFAULT 0,
  is_private boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own communities" ON public.communities FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete own communities" ON public.communities FOR DELETE USING (auth.uid() = created_by);

-- Create community members table
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Community members policies
CREATE POLICY "Community members are viewable by everyone" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Create causes table for Herald Causes
CREATE TABLE IF NOT EXISTS public.causes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  goal_amount integer NOT NULL DEFAULT 0,
  raised_amount integer DEFAULT 0,
  created_by uuid NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on causes
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;

-- Causes policies
CREATE POLICY "Causes are viewable by everyone" ON public.causes FOR SELECT USING (true);
CREATE POLICY "Users can create causes" ON public.causes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own causes" ON public.causes FOR UPDATE USING (auth.uid() = created_by);

-- Create cause donations table
CREATE TABLE IF NOT EXISTS public.cause_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cause_id uuid NOT NULL REFERENCES public.causes(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL,
  amount integer NOT NULL,
  message text,
  anonymous boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cause_donations
ALTER TABLE public.cause_donations ENABLE ROW LEVEL SECURITY;

-- Cause donations policies
CREATE POLICY "Donations are viewable by everyone" ON public.cause_donations FOR SELECT USING (true);
CREATE POLICY "Users can make donations" ON public.cause_donations FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- Enable realtime for communities and causes
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.causes;