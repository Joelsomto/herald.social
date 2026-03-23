import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Radio, Play, Eye } from 'lucide-react';
import { getStreams } from '@/lib/api/streams';
import type { LiveStream } from '@/lib/api/streams';

interface LiveSectionProps {
  compact?: boolean;
}

export function LiveSection({ compact = false }: LiveSectionProps) {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStreams({ status: 'live', limit: 6 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setStreams(list);
      })
      .catch(() => setStreams([]))
      .finally(() => setLoading(false));
  }, []);

  const formatViewers = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);

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
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : streams.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No live streams right now</p>
          ) : (
            streams.slice(0, 2).map((stream) => (
              <div
                key={stream.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/live/${stream.id}`)}
              >
                <div className="relative w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {stream.thumbnail_url ? (
                    <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 py-0">LIVE</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{stream.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViewers(stream.viewer_count)} watching
                  </p>
                </div>
              </div>
            ))
          )}
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
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/live')}>
          View All
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Radio className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No live streams right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => (
            <Card
              key={stream.id}
              className="bg-card border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/live/${stream.id}`)}
            >
              <div className="relative aspect-video bg-secondary flex items-center justify-center">
                {stream.thumbnail_url ? (
                  <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <Video className="w-12 h-12 text-muted-foreground" />
                )}
                <Badge className="absolute top-2 left-2 bg-red-500">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE
                </Badge>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">{formatViewers(stream.viewer_count)}</span>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-foreground text-sm line-clamp-2">{stream.title}</p>
                {stream.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{stream.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
