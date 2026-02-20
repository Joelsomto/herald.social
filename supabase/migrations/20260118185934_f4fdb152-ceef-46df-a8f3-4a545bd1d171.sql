-- Create table for live stream chat messages
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view chat messages
CREATE POLICY "Anyone can view live chat messages"
ON public.live_chat_messages
FOR SELECT
USING (true);

-- Authenticated users can send messages
CREATE POLICY "Users can send chat messages"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create table for stream donations
CREATE TABLE public.stream_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stream_donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view donations
CREATE POLICY "Anyone can view stream donations"
ON public.stream_donations
FOR SELECT
USING (true);

-- Users can make donations
CREATE POLICY "Users can make donations"
ON public.stream_donations
FOR INSERT
WITH CHECK (auth.uid() = donor_id);

-- Enable realtime for chat messages and donations
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_donations;

-- Also enable realtime for live_streams for viewer count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;