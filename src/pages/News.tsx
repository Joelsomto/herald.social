import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper,
  Search,
  ExternalLink,
  Clock,
  Bookmark,
  Share2,
  TrendingUp,
  Sparkles,
  Church,
  Stethoscope,
  Globe,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserWallet } from '@/lib/api/wallets';
import { getNews } from '@/lib/api/news';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { formatDistanceToNow } from 'date-fns';

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  source_type: string;
  image_url: string | null;
  external_url: string | null;
  published_at: string;
}

const sourceIcons: Record<string, React.ElementType> = {
  herald: Sparkles,
  loveworld: Church,
  healing_school: Stethoscope,
  external: Globe,
};

const sourceLabels: Record<string, string> = {
  herald: 'Herald Social',
  loveworld: 'Loveworld News',
  healing_school: 'Healing School',
  external: 'Christian News',
};



export default function News() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ httn_points: number; httn_tokens: number; espees: number; pending_rewards: number } | null>(null);

  const fetchNews = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getNews({ limit: 50, sort: '-created_at' });
      setNews(res.data || []);
    } catch {
      setError('Failed to load news.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCurrentUserWallet();
      if (data) setWallet(data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNews();
    if (user) fetchWallet();
  }, [fetchNews, user, fetchWallet]);

  const toggleSaved = (id: string) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const walletBalance = wallet
    ? { httnPoints: wallet.httn_points, httnTokens: Number(wallet.httn_tokens), espees: Number(wallet.espees), pendingRewards: wallet.pending_rewards }
    : { httnPoints: 0, httnTokens: 0, espees: 0, pendingRewards: 0 };

  const rightSidebar = (
    <>
      {user && <WalletPreview balance={walletBalance} />}

      {/* Trending Topics */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {['#HealingSchool2026', '#GlobalPrayer', '#RhapsodyReaders', '#HeraldCommunity', '#FaithRising'].map((topic) => (
            <Button key={topic} variant="ghost" size="sm" className="w-full justify-start text-sm">
              {topic}
            </Button>
          ))}
        </CardContent>
      </Card>

      <VerticalAdBanner {...verticalAds[2]} />
    </>
  );

  const NewsCard = ({ article, featured = false }: { article: NewsArticle; featured?: boolean }) => {
    const Icon = sourceIcons[article.source_type] || Globe;
    const isSaved = savedArticles.includes(article.id);

    return (
      <Card className={`bg-card border-border overflow-hidden hover:border-primary/30 transition-colors ${featured ? 'md:col-span-2' : ''}`}>
        {article.image_url && (
          <div className={`relative ${featured ? 'aspect-[21/9]' : 'aspect-video'} bg-secondary`}>
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            <Badge className="absolute top-3 left-3 gap-1">
              <Icon className="w-3 h-3" />
              {sourceLabels[article.source_type]}
            </Badge>
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          <h3 className={`font-display font-semibold text-foreground ${featured ? 'text-xl' : 'text-base'}`}>
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.summary}
            </p>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleSaved(article.id)}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-primary' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="w-4 h-4" />
              </Button>
              {article.external_url && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={article.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                Herald News
              </h1>
              <p className="text-sm text-muted-foreground">Christian, Loveworld & Healing School News</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {error && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={fetchNews}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {/* Source Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All News</TabsTrigger>
            <TabsTrigger value="herald" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Herald
            </TabsTrigger>
            <TabsTrigger value="loveworld" className="gap-1">
              <Church className="w-3 h-3" />
              Loveworld
            </TabsTrigger>
            <TabsTrigger value="healing_school" className="gap-1">
              <Stethoscope className="w-3 h-3" />
              Healing School
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-1">
              <Globe className="w-3 h-3" />
              Christian News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredNews.map((article, index) => (
                  <NewsCard 
                    key={article.id} 
                    article={article} 
                    featured={index === 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {Object.keys(sourceLabels).map((sourceType) => (
            <TabsContent key={sourceType} value={sourceType} className="mt-6">
              {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredNews
                  .filter(n => n.source_type === sourceType)
                  .map((article, index) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      featured={index === 0}
                    />
                  ))}
              </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
