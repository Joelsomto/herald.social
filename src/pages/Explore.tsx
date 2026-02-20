import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Flame, 
  Sparkles,
  Play,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollableReels } from '@/components/herald/ScrollableReels';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { walletBalance } from '@/data/mockData';

interface Creator {
  display_name: string;
  username: string;
  avatar_url: string | null;
  tier: string;
  reputation: number;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  httn_earned: number;
  author: Creator;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [reels, setReels] = useState<Post[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [postsRes, creatorsRes, reelsRes] = await Promise.all([
      supabase
        .from('posts')
        .select(`*, author:profiles!posts_author_id_fkey(display_name, username, avatar_url, tier, reputation)`)
        .order('likes_count', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('*')
        .order('reputation', { ascending: false })
        .limit(10),
      supabase
        .from('posts')
        .select(`*, author:profiles!posts_author_id_fkey(display_name, username, avatar_url, tier, reputation)`)
        .eq('media_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    if (postsRes.data) setTrendingPosts(postsRes.data.map(p => ({ ...p, author: p.author as unknown as Creator })));
    if (creatorsRes.data) setTopCreators(creatorsRes.data);
    if (reelsRes.data) setReels(reelsRes.data.map(p => ({ ...p, author: p.author as unknown as Creator })));
  };

  // Dummy data for demo
  const dummyPosts: Post[] = [
    { id: '1', content: 'Just earned 500 HTTN from my latest video! 🎉 #HeraldLaunch', media_url: null, media_type: null, likes_count: 245, comments_count: 32, shares_count: 18, httn_earned: 500, author: { display_name: 'Sarah Chen', username: 'sarahcreates', avatar_url: null, tier: 'creator', reputation: 2500 } },
    { id: '2', content: 'The creator economy is changing. Herald is leading the way 🚀', media_url: null, media_type: null, likes_count: 189, comments_count: 24, shares_count: 45, httn_earned: 320, author: { display_name: 'Alex Rivera', username: 'alexr', avatar_url: null, tier: 'herald', reputation: 5200 } },
    { id: '3', content: 'Completed my weekly tasks and got bonus tokens! Who else is grinding? 💪', media_url: null, media_type: null, likes_count: 156, comments_count: 18, shares_count: 12, httn_earned: 180, author: { display_name: 'Jordan Taylor', username: 'jtaylor', avatar_url: null, tier: 'participant', reputation: 850 } },
  ];

  const dummyReels: Post[] = [
    { id: 'r1', content: 'Quick tips for earning more HTTN!', media_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', media_type: 'reel', likes_count: 1240, comments_count: 89, shares_count: 156, httn_earned: 850, author: { display_name: 'Mike Johnson', username: 'mikej', avatar_url: null, tier: 'creator', reputation: 3200 } },
    { id: 'r2', content: 'Day in my life as a Herald creator', media_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', media_type: 'reel', likes_count: 892, comments_count: 67, shares_count: 98, httn_earned: 620, author: { display_name: 'Emma Wilson', username: 'emmaw', avatar_url: null, tier: 'herald', reputation: 4100 } },
    { id: 'r3', content: 'Web3 explained in 60 seconds', media_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400', media_type: 'reel', likes_count: 2100, comments_count: 145, shares_count: 320, httn_earned: 1200, author: { display_name: 'David Kim', username: 'davidk', avatar_url: null, tier: 'partner', reputation: 8500 } },
    { id: 'r4', content: 'How I earned 10K HTTN this month', media_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400', media_type: 'reel', likes_count: 756, comments_count: 43, shares_count: 67, httn_earned: 480, author: { display_name: 'Lisa Park', username: 'lisap', avatar_url: null, tier: 'creator', reputation: 2800 } },
    { id: 'r5', content: 'Building my brand on Herald 🔥', media_url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400', media_type: 'reel', likes_count: 1890, comments_count: 124, shares_count: 234, httn_earned: 980, author: { display_name: 'James Rodriguez', username: 'jamesrod', avatar_url: null, tier: 'herald', reputation: 6700 } },
    { id: 'r6', content: 'Token economics for beginners', media_url: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400', media_type: 'reel', likes_count: 2340, comments_count: 189, shares_count: 456, httn_earned: 1450, author: { display_name: 'Nina Patel', username: 'ninapatel', avatar_url: null, tier: 'partner', reputation: 9200 } },
    { id: 'r7', content: 'Morning routine of a top creator', media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', media_type: 'reel', likes_count: 567, comments_count: 34, shares_count: 78, httn_earned: 320, author: { display_name: 'Chris Lee', username: 'chrislee', avatar_url: null, tier: 'creator', reputation: 2100 } },
    { id: 'r8', content: 'My 1 million HTTN journey', media_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400', media_type: 'reel', likes_count: 4500, comments_count: 345, shares_count: 890, httn_earned: 2800, author: { display_name: 'Marcus King', username: 'marcusk', avatar_url: null, tier: 'herald', reputation: 15000 } },
    { id: 'r9', content: 'Create viral content in 5 steps', media_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400', media_type: 'reel', likes_count: 1678, comments_count: 98, shares_count: 234, httn_earned: 890, author: { display_name: 'Sofia Martinez', username: 'sofiam', avatar_url: null, tier: 'creator', reputation: 4300 } },
    { id: 'r10', content: 'Community building masterclass', media_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400', media_type: 'reel', likes_count: 987, comments_count: 67, shares_count: 145, httn_earned: 540, author: { display_name: 'Ryan Chen', username: 'ryanchen', avatar_url: null, tier: 'creator', reputation: 3400 } },
    { id: 'r11', content: 'What nobody tells you about Web3', media_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', media_type: 'reel', likes_count: 3200, comments_count: 267, shares_count: 567, httn_earned: 1890, author: { display_name: 'Alex Thompson', username: 'alexthompson', avatar_url: null, tier: 'partner', reputation: 11000 } },
    { id: 'r12', content: 'From 0 to 10K followers', media_url: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=400', media_type: 'reel', likes_count: 2100, comments_count: 156, shares_count: 345, httn_earned: 1200, author: { display_name: 'Emily Zhang', username: 'emilyzhang', avatar_url: null, tier: 'herald', reputation: 7800 } },
  ];

  const displayPosts = trendingPosts.length > 0 ? trendingPosts : dummyPosts;
  const displayReels = reels.length > 0 ? reels : dummyReels;

  const trendingTopics = [
    { name: '#HeraldLaunch', posts: 1234 },
    { name: '#Web3Creators', posts: 856 },
    { name: '#HTTNRewards', posts: 642 },
    { name: '#CreatorEconomy', posts: 521 },
    { name: '#EarnWithHerald', posts: 398 },
  ];

  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % verticalAds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      <VerticalAdBanner {...verticalAds[adIndex]} />
    </>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {/* Search Header */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search creators, posts, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList>
            <TabsTrigger value="trending" className="gap-2">
              <Flame className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="creators" className="gap-2">
              <Users className="w-4 h-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-2">
              <Play className="w-4 h-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending" className="mt-6 space-y-6">
            {/* Trending Topics */}
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {topic.name}
                    <Badge variant="secondary" className="text-xs">
                      {topic.posts}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending Posts */}
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Hot Posts
              </h3>
              <div className="grid gap-4">
                {displayPosts.map((post) => (
                    <Card key={post.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold">
                            {post.author?.display_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {post.author?.display_name || 'Unknown'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                @{post.author?.username || 'unknown'}
                              </span>
                            </div>
                            <p className="text-foreground mt-1">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Heart className="w-4 h-4" /> {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MessageCircle className="w-4 h-4" /> {post.comments_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Share2 className="w-4 h-4" /> {post.shares_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm gold-text ml-auto">
                                <Sparkles className="w-4 h-4" /> {post.httn_earned} HTTN
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {topCreators.map((creator, index) => (
                <Card key={creator.username} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center font-display text-xl font-bold">
                          {creator.display_name?.[0] || '?'}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">
                          {creator.display_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {creator.tier}
                          </Badge>
                          <span className="text-xs gold-text flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {creator.reputation} Rep
                          </span>
                        </div>
                      </div>
                      <Button variant="gold" size="sm">
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reels Tab */}
          <TabsContent value="reels" className="mt-0 -mx-6 -mb-6">
            <ScrollableReels />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'Herald Creators', members: 1234, category: 'Official' },
                { name: 'Web3 Enthusiasts', members: 856, category: 'Tech' },
                { name: 'Content Creators Hub', members: 642, category: 'Creative' },
                { name: 'Token Economics', members: 521, category: 'Finance' },
              ].map((community, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">
                          {community.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {community.members.toLocaleString()} members
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {community.category}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
