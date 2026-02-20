-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post media
CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create scheduled posts table
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts"
ON public.scheduled_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled posts"
ON public.scheduled_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
ON public.scheduled_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
ON public.scheduled_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create messages table for DMs
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Create conversations view for easier message querying
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Add is_creator flag to profiles for creator dashboard unlock
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false;