import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  TrendingUp,
  Heart,
  Users,
  BadgeCheck,
  Flame,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  tier: string;
  reputation: number;
  is_verified: boolean;
  total_engagement: number;
  httn_points?: number;
}

const rankIcons = [
  { icon: Crown, color: 'text-primary', bgColor: 'bg-primary/20' },
  { icon: Medal, color: 'text-gray-300', bgColor: 'bg-gray-300/20' },
  { icon: Medal, color: 'text-amber-600', bgColor: 'bg-amber-600/20' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [reputationLeaders, setReputationLeaders] = useState<LeaderboardEntry[]>([]);
  const [engagementLeaders, setEngagementLeaders] = useState<LeaderboardEntry[]>([]);
  const [pointsLeaders, setPointsLeaders] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboards();
  }, [user]);

  const fetchLeaderboards = async () => {
    // Fetch reputation leaders
    const { data: repData } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, tier, reputation, is_verified, total_engagement')
      .order('reputation', { ascending: false })
      .limit(50);

    if (repData) {
      setReputationLeaders(repData as LeaderboardEntry[]);
      if (user) {
        const userIndex = repData.findIndex(p => p.user_id === user.id);
        if (userIndex !== -1) setUserRank(userIndex + 1);
      }
    }

    // Fetch engagement leaders
    const { data: engData } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, tier, reputation, is_verified, total_engagement')
      .order('total_engagement', { ascending: false })
      .limit(50);

    if (engData) {
      setEngagementLeaders(engData as LeaderboardEntry[]);
    }

    // Fetch points leaders (join with wallets)
    const { data: pointsData } = await supabase
      .from('wallets')
      .select(`
        httn_points,
        user_id
      `)
      .order('httn_points', { ascending: false })
      .limit(50);

    if (pointsData) {
      // Get profiles for these users
      const userIds = pointsData.map(w => w.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, tier, reputation, is_verified, total_engagement')
        .in('user_id', userIds);

      if (profilesData) {
        const combined = pointsData.map(wallet => {
          const profile = profilesData.find(p => p.user_id === wallet.user_id);
          return {
            ...profile,
            httn_points: wallet.httn_points,
          } as LeaderboardEntry;
        });
        setPointsLeaders(combined);
      }
    }
  };

  const tierConfig: Record<string, { label: string; color: string }> = {
    herald: { label: 'Herald', color: 'bg-primary text-primary-foreground' },
    creator: { label: 'Creator', color: 'bg-herald-violet text-white' },
    participant: { label: 'Participant', color: 'bg-secondary text-secondary-foreground' },
    partner: { label: 'Partner', color: 'bg-herald-ember text-white' },
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number, metric: 'reputation' | 'engagement' | 'points') => {
    const isTopThree = index < 3;
    const RankIcon = isTopThree ? rankIcons[index].icon : null;

    return (
      <div
        key={entry.user_id}
        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
          user?.id === entry.user_id ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'
        }`}
      >
        {/* Rank */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold ${
          isTopThree ? rankIcons[index].bgColor : 'bg-secondary'
        }`}>
          {RankIcon ? (
            <RankIcon className={`w-5 h-5 ${rankIcons[index].color}`} />
          ) : (
            <span className="text-muted-foreground">{index + 1}</span>
          )}
        </div>

        {/* Avatar & Info */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={entry.avatar_url || ''} />
            <AvatarFallback className="bg-secondary font-display">
              {entry.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {entry.display_name || 'Anonymous'}
              </span>
              {entry.is_verified && (
                <BadgeCheck className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">@{entry.username || 'user'}</span>
              <Badge className={`text-xs ${tierConfig[entry.tier || 'participant'].color}`}>
                {tierConfig[entry.tier || 'participant'].label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metric */}
        <div className="text-right">
          <p className={`font-display font-bold text-lg ${metric === 'points' ? 'gold-text' : 'text-foreground'}`}>
            {metric === 'reputation' && entry.reputation?.toLocaleString()}
            {metric === 'engagement' && entry.total_engagement?.toLocaleString()}
            {metric === 'points' && entry.httn_points?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {metric === 'reputation' && 'Reputation'}
            {metric === 'engagement' && 'Engagement'}
            {metric === 'points' && 'HTTN Points'}
          </p>
        </div>
      </div>
    );
  };

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[3]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">See who's leading the Herald community</p>
          </div>
          {userRank && (
            <Card className="bg-card border-primary">
              <CardContent className="p-4 flex items-center gap-3">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="font-display font-bold text-xl text-foreground">#{userRank}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top 3 Showcase */}
        <div className="grid md:grid-cols-3 gap-4">
          {reputationLeaders.slice(0, 3).map((leader, index) => (
            <Card
              key={leader.user_id}
              className={`bg-card border-border relative overflow-hidden ${
                index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary" />
              )}
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${rankIcons[index].bgColor}`}>
                  {index === 0 ? (
                    <Crown className={`w-7 h-7 ${rankIcons[index].color}`} />
                  ) : (
                    <Medal className={`w-7 h-7 ${rankIcons[index].color}`} />
                  )}
                </div>
                <Avatar className="w-16 h-16 mx-auto mt-4 border-2 border-border">
                  <AvatarImage src={leader.avatar_url || ''} />
                  <AvatarFallback className="bg-secondary font-display text-xl">
                    {leader.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    {leader.display_name}
                  </h3>
                  {leader.is_verified && <BadgeCheck className="w-5 h-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">@{leader.username}</p>
                <p className="font-display font-bold text-2xl gold-text mt-2">
                  {leader.reputation?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Reputation</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Tabs defaultValue="reputation" className="w-full">
          <TabsList>
            <TabsTrigger value="reputation" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Reputation
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <Heart className="w-4 h-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-2">
              <Sparkles className="w-4 h-4" />
              HTTN Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reputation" className="mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                {reputationLeaders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                ) : (
                  reputationLeaders.map((entry, index) =>
                    renderLeaderboardEntry(entry, index, 'reputation')
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                {engagementLeaders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                ) : (
                  engagementLeaders.map((entry, index) =>
                    renderLeaderboardEntry(entry, index, 'engagement')
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points" className="mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                {pointsLeaders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                ) : (
                  pointsLeaders.map((entry, index) =>
                    renderLeaderboardEntry(entry, index, 'points')
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
