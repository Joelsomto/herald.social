import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/apiClient';

interface TrendingTopic {
  name: string;
  posts: string;
}

const FALLBACK_TOPICS: TrendingTopic[] = [
  { name: '#HeraldSocial', posts: 'Trending' },
  { name: '#HTTNRewards', posts: 'Trending' },
  { name: '#Web3Creators', posts: 'Trending' },
  { name: '#CreatorEconomy', posts: 'Trending' },
  { name: '#EarnWithHerald', posts: 'Trending' },
];

export function TrendingSection() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>('/trending/topics/')
      .then((res) => {
        const list: any[] = Array.isArray(res)
          ? res
          : (res as any)?.results ?? (res as any)?.data ?? [];
        if (list.length > 0) {
          setTopics(
            list.slice(0, 5).map((t: any) => ({
              name: t.name ?? t.tag ?? t.topic ?? '#Unknown',
              posts:
                t.posts_count != null
                  ? `${Number(t.posts_count).toLocaleString()} posts`
                  : 'Trending',
            }))
          );
        } else {
          setTopics(FALLBACK_TOPICS);
        }
      })
      .catch(() => setTopics(FALLBACK_TOPICS))
      .finally(() => setLoading(false));
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
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
