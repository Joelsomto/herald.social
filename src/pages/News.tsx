import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { walletBalance } from '@/data/mockData';
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

const demoNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Healing School Graduation: Over 50,000 Students Celebrate Divine Healing',
    summary: 'The Healing School Online Campus celebrated another successful graduation with testimonies of miraculous healings from around the world.',
    content: null,
    source: 'Healing School',
    source_type: 'healing_school',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Pastor Chris Announces Global Prayer Program for 2026',
    summary: 'A new initiative to unite believers worldwide in prayer has been launched, with special focus on reaching the unreached.',
    content: null,
    source: 'Loveworld News',
    source_type: 'loveworld',
    image_url: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Herald Social Reaches 1 Million Active Heralds',
    summary: 'The platform celebrates a major milestone as the community continues to grow with mission-aligned engagement.',
    content: null,
    source: 'Herald Social',
    source_type: 'herald',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'New Study Shows Faith-Based Communities Growing Globally',
    summary: 'Research indicates significant growth in faith communities across Asia and Africa, with digital platforms playing a key role.',
    content: null,
    source: 'Christian Daily',
    source_type: 'external',
    image_url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
    external_url: 'https://example.com',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Rhapsody of Realities Translated into 100th Language',
    summary: 'The popular daily devotional reaches another milestone, now available in 100 languages worldwide.',
    content: null,
    source: 'Loveworld News',
    source_type: 'loveworld',
    image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Healing Testimonies: Cancer Healed Through Prayer',
    summary: 'Multiple testimonies emerge from the latest Healing Streams session with documented medical verifications.',
    content: null,
    source: 'Healing School',
    source_type: 'healing_school',
    image_url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Herald Causes Surpasses $1M in Donations',
    summary: 'The community has collectively donated over $1 million in HTTN to support various missionary and outreach projects.',
    content: null,
    source: 'Herald Social',
    source_type: 'herald',
    image_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    title: 'Youth Conference 2026: Dates Announced',
    summary: 'The annual global youth conference will be held in multiple cities simultaneously with virtual participation options.',
    content: null,
    source: 'Loveworld News',
    source_type: 'loveworld',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600',
    external_url: null,
    published_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

export default function News() {
  const [news, setNews] = useState<NewsArticle[]>(demoNews);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);
    
    if (data && data.length > 0) {
      setNews(data);
    }
  };

  const toggleSaved = (id: string) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      
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
            <div className="grid md:grid-cols-2 gap-4">
              {filteredNews.map((article, index) => (
                <NewsCard 
                  key={article.id} 
                  article={article} 
                  featured={index === 0}
                />
              ))}
            </div>
          </TabsContent>

          {Object.keys(sourceLabels).map((sourceType) => (
            <TabsContent key={sourceType} value={sourceType} className="mt-6">
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
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
