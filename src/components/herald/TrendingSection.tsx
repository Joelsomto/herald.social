import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const trendingTopics = [
  { name: '#HeraldLaunch', posts: '12.4K posts' },
  { name: '#Web3Creators', posts: '8.5K posts' },
  { name: '#HTTNRewards', posts: '6.4K posts' },
  { name: '#CreatorEconomy', posts: '5.2K posts' },
  { name: '#EarnWithHerald', posts: '3.9K posts' },
];

export function TrendingSection() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div 
            key={topic.name} 
            className="cursor-pointer hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
          >
            <p className="text-xs text-muted-foreground">
              {index + 1} · Trending
            </p>
            <p className="font-medium text-foreground">{topic.name}</p>
            <p className="text-xs text-muted-foreground">{topic.posts}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
