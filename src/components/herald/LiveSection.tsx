import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Radio, Users, Play, Eye, BadgeCheck } from 'lucide-react';

interface LiveStream {
  id: string;
  title: string;
  host: {
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  viewerCount: number;
  thumbnail?: string;
  isLive: boolean;
}

// Demo live streams
const DEMO_STREAMS: LiveStream[] = [
  {
    id: '1',
    title: 'Morning Devotional - Living in Purpose',
    host: { name: 'Pastor Chris', username: 'pastorchris', verified: true },
    viewerCount: 12500,
    isLive: true,
  },
  {
    id: '2',
    title: 'Web3 and Faith: Building the Future',
    host: { name: 'Herald Official', username: 'herald', verified: true },
    viewerCount: 3400,
    isLive: true,
  },
  {
    id: '3',
    title: 'Creator Spotlight: How I Earned 10k HTTN',
    host: { name: 'Sarah Chen', username: 'sarahcreates', verified: true },
    viewerCount: 890,
    isLive: true,
  },
];

interface LiveSectionProps {
  compact?: boolean;
}

export function LiveSection({ compact = false }: LiveSectionProps) {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<LiveStream[]>(DEMO_STREAMS);

  if (compact) {
    return (
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            Live Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {streams.slice(0, 2).map((stream) => (
            <div 
              key={stream.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <div className="relative w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                <Video className="w-5 h-5 text-muted-foreground" />
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 py-0">
                  LIVE
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{stream.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stream.host.name}
                  {stream.host.verified && <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                {stream.viewerCount >= 1000 
                  ? `${(stream.viewerCount / 1000).toFixed(1)}k` 
                  : stream.viewerCount
                }
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate('/live')}>
            See all live streams
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          Live Now
        </h2>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {streams.map((stream) => (
          <Card 
            key={stream.id} 
            className="bg-card border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="relative aspect-video bg-secondary flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
              <Badge className="absolute top-2 left-2 bg-red-500">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                LIVE
              </Badge>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                <Eye className="w-3 h-3 text-white" />
                <span className="text-xs text-white">
                  {stream.viewerCount >= 1000 
                    ? `${(stream.viewerCount / 1000).toFixed(1)}k` 
                    : stream.viewerCount
                  }
                </span>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardContent className="p-3">
              <p className="font-semibold text-foreground text-sm line-clamp-2">{stream.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={stream.host.avatar} />
                  <AvatarFallback className="text-xs">{stream.host.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {stream.host.name}
                  {stream.host.verified && <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
