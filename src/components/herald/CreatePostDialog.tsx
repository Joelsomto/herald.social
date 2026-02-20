import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Film, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MediaUpload } from './MediaUpload';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        media_type: mediaType,
        media_url: mediaUrl,
      });

      if (error) throw error;

      toast({
        title: 'Post created!',
        description: 'Your content is now live. +5 HTTN Points earned!',
      });

      // Award points for posting
      const { data: wallet } = await supabase
        .from('wallets')
        .select('httn_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        await supabase.from('wallets').update({
          httn_points: wallet.httn_points + 5,
        }).eq('user_id', user.id);
      }

      setContent('');
      setMediaType(null);
      setMediaUrl(null);
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploaded = (url: string, type: string) => {
    setMediaUrl(url);
  };

  const handleMediaRemoved = () => {
    setMediaUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-input border-border resize-none"
          />

          <Tabs value={mediaType || 'none'} onValueChange={(v) => {
            setMediaType(v === 'none' ? null : v);
            if (v === 'none') setMediaUrl(null);
          }}>
            <TabsList className="w-full">
              <TabsTrigger value="none" className="flex-1">Text Only</TabsTrigger>
              <TabsTrigger value="image" className="flex-1 gap-1">
                <Image className="w-4 h-4" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1 gap-1">
                <Video className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="reel" className="flex-1 gap-1">
                <Film className="w-4 h-4" /> Reel
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {user && mediaType && (
            <MediaUpload
              userId={user.id}
              mediaType={mediaType}
              onMediaUploaded={handleMediaUploaded}
              onMediaRemoved={handleMediaRemoved}
              currentMediaUrl={mediaUrl || undefined}
            />
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <span className="text-sm text-muted-foreground">Posting rewards you</span>
            <span className="text-sm gold-text font-semibold flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> +5 HTTN Points
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
