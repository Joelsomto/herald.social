import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, ExternalLink, Clock, Sparkles, Globe, Cross } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: 'herald' | 'loveworld' | 'external';
  imageUrl?: string;
  externalUrl?: string;
  publishedAt: Date;
}

// Demo news articles
const DEMO_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Herald Social Reaches 1 Million Active Users',
    summary: 'The Web3 social platform celebrates a major milestone as community growth accelerates.',
    source: 'Herald News',
    sourceType: 'herald',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '2',
    title: 'New HTTN Staking Features Coming Soon',
    summary: 'Earn passive rewards by staking your HTTN tokens in the upcoming platform update.',
    source: 'Herald News',
    sourceType: 'herald',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: '3',
    title: 'Global Day of Prayer: Millions Unite Worldwide',
    summary: 'Believers from over 150 nations participated in the largest synchronized prayer event.',
    source: 'LoveWorld News',
    sourceType: 'loveworld',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: '4',
    title: 'Healing School Graduates Transform Communities',
    summary: 'Testimonials pour in as graduates share miraculous stories of transformation.',
    source: 'LoveWorld News',
    sourceType: 'loveworld',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: '5',
    title: 'Crypto Market Shows Strong Recovery',
    summary: 'Bitcoin and major altcoins rally as institutional interest grows.',
    source: 'CoinDesk',
    sourceType: 'external',
    externalUrl: 'https://coindesk.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: '6',
    title: 'Web3 Social Platforms Gain Mainstream Traction',
    summary: 'Decentralized social networks see unprecedented user growth in Q4.',
    source: 'TechCrunch',
    sourceType: 'external',
    externalUrl: 'https://techcrunch.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

const sourceIcons = {
  herald: Sparkles,
  loveworld: Cross,
  external: Globe,
};

const sourceColors = {
  herald: 'bg-primary/20 text-primary',
  loveworld: 'bg-purple-500/20 text-purple-500',
  external: 'bg-blue-500/20 text-blue-500',
};

interface NewsSectionProps {
  compact?: boolean;
}

export function NewsSection({ compact = false }: NewsSectionProps) {
  const [news, setNews] = useState<NewsArticle[]>(DEMO_NEWS);
  const [filter, setFilter] = useState<'all' | 'herald' | 'loveworld' | 'external'>('all');

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(n => n.sourceType === filter);

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
          {news.slice(0, 3).map((article) => {
            const Icon = sourceIcons[article.sourceType];
            return (
              <div 
                key={article.id}
                className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
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
          })}
          <Button variant="ghost" size="sm" className="w-full text-primary">
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
          <div className="space-y-4">
            {filteredNews.map((article) => {
              const Icon = sourceIcons[article.sourceType];
              return (
                <Card 
                  key={article.id}
                  className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
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
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                        {article.externalUrl && (
                          <a 
                            href={article.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                          >
                            Read more <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
