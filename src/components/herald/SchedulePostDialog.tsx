import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Video, Film, Send, Calendar, Clock, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MediaUpload } from './MediaUpload';

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostScheduled: () => void;
  suggestedTimes?: string[];
}

export function SchedulePostDialog({ 
  open, 
  onOpenChange, 
  onPostScheduled,
  suggestedTimes = []
}: SchedulePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(suggestedTimes);

  useEffect(() => {
    if (open && aiSuggestions.length === 0) {
      fetchAISuggestions();
    }
  }, [open]);

  const fetchAISuggestions = async () => {
    setFetchingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-insights', {
        body: {
          action: 'suggest_times',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      if (data?.optimal_times) {
        setAiSuggestions(data.optimal_times);
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const handleSelectSuggestedTime = (timeString: string) => {
    const date = new Date(timeString);
    setScheduledDate(date.toISOString().split('T')[0]);
    setScheduledTime(date.toTimeString().slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!user || !content.trim() || !scheduledDate || !scheduledTime) return;

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledFor <= new Date()) {
      toast({
        title: 'Invalid time',
        description: 'Please select a future date and time',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: user.id,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        scheduled_for: scheduledFor.toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Post scheduled!',
        description: `Your post will be published on ${scheduledFor.toLocaleString()}`,
      });

      setContent('');
      setMediaType(null);
      setMediaUrl(null);
      setScheduledDate('');
      setScheduledTime('');
      onOpenChange(false);
      onPostScheduled();
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
    setMediaType(type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-input border-border resize-none"
          />

          <Tabs value={mediaType || 'none'} onValueChange={(v) => setMediaType(v === 'none' ? null : v)}>
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
              onMediaRemoved={() => setMediaUrl(null)}
              currentMediaUrl={mediaUrl || undefined}
            />
          )}

          {/* AI Suggested Times */}
          {aiSuggestions.length > 0 && (
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">AI Suggested Times</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((time, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectSuggestedTime(time)}
                      className="text-xs"
                    >
                      {new Date(time).toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {fetchingSuggestions && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Fetching AI suggestions...
            </div>
          )}

          {/* Manual Date/Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-input"
              />
            </div>
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
              disabled={!content.trim() || !scheduledDate || !scheduledTime || loading}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
