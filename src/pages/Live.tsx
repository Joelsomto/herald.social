import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { MobileBottomNav } from '@/components/herald/MobileBottomNav';
import { RightSidebarWithAds } from '@/components/herald/RightSidebarWithAds';
import { LiveStreamViewer } from '@/components/herald/LiveStreamViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Video, Radio, Users, Play, Eye, BadgeCheck, Plus, Calendar,
  TrendingUp, Clock, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  viewer_count: number;
  status: string;
  scheduled_for: string | null;
  thumbnail_url: string | null;
  profile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

// Demo streams for when DB is empty
const DEMO_STREAMS: LiveStream[] = [
  {
    id: 'demo-1',
    title: 'Morning Devotional - Living in Purpose',
    description: 'Join us for a powerful morning session',
    user_id: 'demo-host-1',
    viewer_count: 12500,
    status: 'live',
    scheduled_for: null,
    thumbnail_url: null,
    profile: {
      display_name: 'Pastor Chris',
      username: 'pastorchris',
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: 'demo-2',
    title: 'Web3 and Faith: Building the Future',
    description: 'Exploring the intersection of technology and spirituality',
    user_id: 'demo-host-2',
    viewer_count: 3400,
    status: 'live',
    scheduled_for: null,
    thumbnail_url: null,
    profile: {
      display_name: 'Herald Official',
      username: 'herald',
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: 'demo-3',
    title: 'Creator Spotlight: How I Earned 10k HTTN',
    description: 'Tips and strategies for maximizing your earnings',
    user_id: 'demo-host-3',
    viewer_count: 890,
    status: 'live',
    scheduled_for: null,
    thumbnail_url: null,
    profile: {
      display_name: 'Sarah Chen',
      username: 'sarahcreates',
      avatar_url: null,
      is_verified: true,
    },
  },
  {
    id: 'demo-4',
    title: 'Night Vibes: Music & Chat',
    description: 'Chill evening session with music',
    user_id: 'demo-host-4',
    viewer_count: 450,
    status: 'live',
    scheduled_for: null,
    thumbnail_url: null,
    profile: {
      display_name: 'Alex Rivera',
      username: 'alexr',
      avatar_url: null,
      is_verified: true,
    },
  },
];

export default function Live() {
  const isMobile = useIsMobile();
  const [streams, setStreams] = useState<LiveStream[]>(DEMO_STREAMS);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    const { data } = await supabase
      .from('live_streams')
      .select('*')
      .order('viewer_count', { ascending: false });

    if (data && data.length > 0) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, is_verified')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      setStreams(data.map(s => ({
        ...s,
        profile: profileMap.get(s.user_id) as LiveStream['profile']
      })));
    }
  };

  const liveStreams = streams.filter(s => s.status === 'live');
  const scheduledStreams = streams.filter(s => s.status === 'scheduled');

  const rightSidebar = (
    <RightSidebarWithAds>
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Streamers
          </h3>
          <div className="space-y-3">
            {liveStreams.slice(0, 3).map((stream) => (
              <div 
                key={stream.id}
                className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
                onClick={() => setSelectedStream(stream)}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={stream.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {stream.profile?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-background" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      {stream.profile?.display_name || 'Unknown'}
                      {stream.profile?.is_verified && (
                        <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count >= 1000 
                        ? `${(stream.viewer_count / 1000).toFixed(1)}k`
                        : stream.viewer_count
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground">Start Streaming</h3>
          <p className="text-sm text-muted-foreground">
            Go live and earn HTTN Points from your audience.
          </p>
          <Button variant="gold" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Go Live
          </Button>
        </CardContent>
      </Card>
    </RightSidebarWithAds>
  );

  return (
    <>
      <MainLayout rightSidebar={rightSidebar}>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              Live
            </h1>
            <Button variant="gold" size="sm" className="gap-1 rounded-full">
              <Plus className="w-4 h-4" />
              Go Live
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border px-4">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger 
                value="live" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0"
              >
                <Radio className="w-4 h-4 mr-2" />
                Live Now
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Scheduled
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="live" className="mt-0">
            {/* Featured Stream */}
            {liveStreams[0] && (
              <div 
                className="p-4 border-b border-border cursor-pointer"
                onClick={() => setSelectedStream(liveStreams[0])}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary group">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                    <Video className="w-16 h-16 text-white/30" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-red-500">
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    LIVE
                  </Badge>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 rounded-full px-3 py-1">
                    <Eye className="w-4 h-4 text-white" />
                    <span className="text-white text-sm">
                      {liveStreams[0].viewer_count >= 1000 
                        ? `${(liveStreams[0].viewer_count / 1000).toFixed(1)}k`
                        : liveStreams[0].viewer_count
                      } watching
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={liveStreams[0].profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {liveStreams[0].profile?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {liveStreams[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      {liveStreams[0].profile?.display_name || 'Unknown'}
                      {liveStreams[0].profile?.is_verified && (
                        <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Live Streams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {liveStreams.slice(1).map((stream) => (
                <Card 
                  key={stream.id}
                  className="bg-card border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedStream(stream)}
                >
                  <div className="relative aspect-video bg-secondary flex items-center justify-center">
                    <Video className="w-10 h-10 text-muted-foreground" />
                    <Badge className="absolute top-2 left-2 bg-red-500 text-xs">
                      <Radio className="w-2 h-2 mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded px-2 py-0.5">
                      <Eye className="w-3 h-3 text-white" />
                      <span className="text-xs text-white">
                        {stream.viewer_count >= 1000 
                          ? `${(stream.viewer_count / 1000).toFixed(1)}k`
                          : stream.viewer_count
                        }
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{stream.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={stream.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {stream.profile?.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {stream.profile?.display_name || 'Unknown'}
                        {stream.profile?.is_verified && (
                          <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {liveStreams.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Radio className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No one is live</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to go live and start earning!
                </p>
                <Button variant="gold" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Start Streaming
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-0 p-4">
            {scheduledStreams.length > 0 ? (
              <div className="space-y-4">
                {scheduledStreams.map((stream) => (
                  <Card key={stream.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{stream.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          {stream.profile?.display_name || 'Unknown'}
                          {stream.profile?.is_verified && (
                            <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />
                          )}
                        </p>
                        {stream.scheduled_for && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(stream.scheduled_for).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Remind Me
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No scheduled streams</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for upcoming streams.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add padding for mobile nav */}
        {isMobile && <div className="h-20" />}
      </MainLayout>

      {/* Stream Viewer Dialog */}
      {selectedStream && (
        <LiveStreamViewer
          open={!!selectedStream}
          onOpenChange={(open) => !open && setSelectedStream(null)}
          streamId={selectedStream.id}
          streamTitle={selectedStream.title}
          host={{
            id: selectedStream.user_id,
            name: selectedStream.profile?.display_name || 'Unknown',
            username: selectedStream.profile?.username || 'unknown',
            avatar: selectedStream.profile?.avatar_url,
            verified: selectedStream.profile?.is_verified || false,
          }}
        />
      )}

      {isMobile && <MobileBottomNav />}
    </>
  );
}
