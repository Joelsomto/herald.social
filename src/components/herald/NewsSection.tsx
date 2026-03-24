import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, ExternalLink, Clock, Sparkles, Globe, Cross } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getNews } from '@/lib/api/news';
import type { NewsArticle as ApiNewsArticle } from '@/lib/api/news';

type SourceType = 'herald' | 'loveworld' | 'external';

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  sourceType: SourceType;
  imageUrl?: string | null;
  externalUrl?: string | null;
  publishedAt: Date;
}

const NEWS_CACHE_TTL_MS = 120_000;
const newsCache = new Map<boolean, { data: NewsItem[]; fetchedAt: number }>();

function mapSourceType(raw: string | undefined): SourceType {
  if (!raw) return 'external';
  const lower = raw.toLowerCase();
  if (lower === 'herald' || lower.includes('herald')) return 'herald';
  if (lower === 'loveworld' || lower.includes('loveworld')) return 'loveworld';
  return 'external';
}

function mapArticle(a: ApiNewsArticle): NewsItem {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    source: a.source,
    sourceType: mapSourceType(a.source_type ?? a.source),
    imageUrl: a.image_url,
    externalUrl: a.external_url,
    publishedAt: new Date(a.published_at),
  };
}

const sourceIcons: Record<SourceType, React.ElementType> = {
  herald: Sparkles,
  loveworld: Cross,
  external: Globe,
};

const sourceColors: Record<SourceType, string> = {
  herald: 'bg-primary/20 text-primary',
  loveworld: 'bg-purple-500/20 text-purple-500',
  external: 'bg-blue-500/20 text-blue-500',
};

interface NewsSectionProps {
  compact?: boolean;
}

export function NewsSection({ compact = false }: NewsSectionProps) {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | SourceType>('all');

  useEffect(() => {
    let active = true;

    const fetchNews = async () => {
      const cached = newsCache.get(compact);
      if (cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL_MS) {
        setNews(cached.data);
        setLoading(false);
        return;
      }

      try {
        const res = await getNews({ limit: compact ? 6 : 20, sort: '-created_at' });
        if (!active) return;

        const nextNews = res.data.map(mapArticle);
        newsCache.set(compact, { data: nextNews, fetchedAt: Date.now() });
        setNews(nextNews);
      } catch {
        if (active) setNews([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNews();
    const intervalId = window.setInterval(fetchNews, 120000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [compact]);

  const filteredNews = filter === 'all' ? news : news.filter((n) => n.sourceType === filter);

  if (compact) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 p-2">
                <Skeleton className="w-6 h-6 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))
          ) : news.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No news available</p>
          ) : (
            news.slice(0, 3).map((article) => {
              const Icon = sourceIcons[article.sourceType];
              return (
                <div
                  key={article.id}
                  className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() =>
                    article.externalUrl
                      ? window.open(article.externalUrl, '_blank', 'noopener,noreferrer')
                      : navigate('/news')
                  }
                >
                  <div className="flex items-start gap-2">
                    <Badge className={`${sourceColors[article.sourceType]} px-1.5 py-0.5`}>
                      <Icon className="w-3 h-3" />
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate('/news')}>
            Read more news
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          News Feed
        </h2>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
          <TabsTrigger value="herald" onClick={() => setFilter('herald')}>
            <Sparkles className="w-3 h-3 mr-1" />
            Herald
          </TabsTrigger>
          <TabsTrigger value="loveworld" onClick={() => setFilter('loveworld')}>
            <Cross className="w-3 h-3 mr-1" />
            LoveWorld
          </TabsTrigger>
          <TabsTrigger value="external" onClick={() => setFilter('external')}>
            <Globe className="w-3 h-3 mr-1" />
            External
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No articles found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.map((article) => {
                const Icon = sourceIcons[article.sourceType];
                return (
                  <Card
                    key={article.id}
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() =>
                      article.externalUrl
                        ? window.open(article.externalUrl, '_blank', 'noopener,noreferrer')
                        : undefined
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {article.imageUrl && (
                          <div className="w-24 h-24 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${sourceColors[article.sourceType]} text-xs`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {article.source}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{article.title}</h3>
                          {article.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                          )}
                          {article.externalUrl && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                              Read more <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
