import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/apiClient';

interface TrendingTopic {
  name: string;
  posts: string;
}

const TOPICS_CACHE_TTL_MS = 60_000;
let topicsCache: { data: TrendingTopic[]; fetchedAt: number } | null = null;

export function TrendingSection() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchTopics = async () => {
      if (topicsCache && Date.now() - topicsCache.fetchedAt < TOPICS_CACHE_TTL_MS) {
        setTopics(topicsCache.data);
        setLoading(false);
        return;
      }

      try {
        const res = await apiGet<any>('/trending/topics/?limit=5');
        const list: any[] = Array.isArray(res)
          ? res
          : (res as any)?.results ?? (res as any)?.data ?? [];

        if (!active) return;

        const nextTopics = list.slice(0, 5).map((t: any) => {
          const rawName = t.name ?? t.tag ?? t.topic ?? 'unknown';
          const normalizedName = String(rawName).startsWith('#') ? String(rawName) : `#${String(rawName)}`;

          return {
            name: normalizedName,
            posts: `${Number(t.posts_count ?? t.count ?? 0).toLocaleString()} posts`,
          };
        });

        topicsCache = { data: nextTopics, fetchedAt: Date.now() };
        setTopics(nextTopics);
      } catch {
        if (active) setTopics([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTopics();
    const intervalId = window.setInterval(fetchTopics, 60000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-2 py-1 space-y-1">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : topics.length > 0 ? (
          topics.map((topic, index) => (
            <div
              key={topic.name}
              className="cursor-pointer hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
            >
              <p className="text-xs text-muted-foreground">{index + 1} · Trending</p>
              <p className="font-medium text-foreground">{topic.name}</p>
              <p className="text-xs text-muted-foreground">{topic.posts}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending topics yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
