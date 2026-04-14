import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Crown,
  Flame,
  Heart,
  Loader2,
  Medal,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

import {
  getEngagementLeaderboard,
  getMyLeaderboardRank,
  getPointsLeaderboard,
  getReputationLeaderboard,
  type LeaderboardEntry,
} from '@/lib/api/leaderboard';
import { MainLayout } from '@/components/herald/MainLayout';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

type MetricKey = 'reputation' | 'engagement' | 'points';

const metricConfig: Record<
  MetricKey,
  {
    label: string;
    icon: typeof TrendingUp;
    description: string;
    empty: string;
    value: (entry: LeaderboardEntry) => number;
    valueLabel: string;
    accent: string;
  }
> = {
  reputation: {
    label: 'Reputation',
    icon: TrendingUp,
    description: 'Ranks the most trusted contributors across Herald.',
    empty: 'No reputation rankings yet.',
    value: (entry) => entry.reputation ?? 0,
    valueLabel: 'Reputation',
    accent: 'text-primary',
  },
  engagement: {
    label: 'Engagement',
    icon: Heart,
    description: 'Measures how much response and conversation each creator drives.',
    empty: 'No engagement rankings yet.',
    value: (entry) => entry.total_engagement ?? 0,
    valueLabel: 'Engagement',
    accent: 'text-rose-500',
  },
  points: {
    label: 'HTTN Points',
    icon: Sparkles,
    description: 'Tracks earned participation across posting, live, communities, causes, and store actions.',
    empty: 'No points rankings yet.',
    value: (entry) => entry.httn_points ?? 0,
    valueLabel: 'HTTN Points',
    accent: 'gold-text',
  },
};

const tierConfig: Record<string, { label: string; color: string }> = {
  herald: { label: 'Herald', color: 'bg-primary text-primary-foreground' },
  creator: { label: 'Creator', color: 'bg-herald-violet text-white' },
  participant: { label: 'Participant', color: 'bg-secondary text-secondary-foreground' },
  partner: { label: 'Partner', color: 'bg-herald-ember text-white' },
};

const rankIcons = [
  { icon: Crown, color: 'text-primary', bgColor: 'bg-primary/20' },
  { icon: Medal, color: 'text-slate-300', bgColor: 'bg-slate-300/20' },
  { icon: Medal, color: 'text-amber-600', bgColor: 'bg-amber-600/20' },
];

export default function Leaderboard() {
  const { user } = useAuth();

  const [activeMetric, setActiveMetric] = useState<MetricKey>('reputation');
  const [reputationLeaders, setReputationLeaders] = useState<LeaderboardEntry[]>([]);
  const [engagementLeaders, setEngagementLeaders] = useState<LeaderboardEntry[]>([]);
  const [pointsLeaders, setPointsLeaders] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [userTotalUsers, setUserTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboards = async () => {
    setError(null);
    setLoading(true);
    try {
      const [repData, engData, ptsData] = await Promise.all([
        getReputationLeaderboard(50),
        getEngagementLeaderboard(50),
        getPointsLeaderboard(50),
      ]);

      setReputationLeaders(repData);
      setEngagementLeaders(engData);
      setPointsLeaders(ptsData);

      if (user) {
        const rankData = await getMyLeaderboardRank();
        if (rankData) {
          setUserRank(rankData.rank);
          setUserPercentile(rankData.percentile);
          setUserTotalUsers(rankData.total_users);
        }
      }
    } catch {
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboards();
  }, [user]);

  const leadersByMetric: Record<MetricKey, LeaderboardEntry[]> = {
    reputation: reputationLeaders,
    engagement: engagementLeaders,
    points: pointsLeaders,
  };

  const activeLeaders = leadersByMetric[activeMetric];
  const activeConfig = metricConfig[activeMetric];

  const summaryCards = useMemo(
    () =>
      (Object.keys(metricConfig) as MetricKey[]).map((metric) => {
        const leader = leadersByMetric[metric][0];
        return {
          metric,
          config: metricConfig[metric],
          leader,
        };
      }),
    [reputationLeaders, engagementLeaders, pointsLeaders]
  );

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number, metric: MetricKey) => {
    const isTopThree = index < 3;
    const RankIcon = isTopThree ? rankIcons[index].icon : null;
    const value = metricConfig[metric].value(entry);
    const isCurrentUser = user?.id === entry.user_id || user?.id === entry.id;

    return (
      <Link
        key={`${metric}-${entry.user_id}-${index}`}
        to={`/user/${entry.username}`}
        className={`flex items-center gap-4 rounded-2xl p-4 transition-colors ${
          isCurrentUser
            ? 'bg-primary/10 border border-primary/30'
            : 'bg-secondary/30 hover:bg-secondary/50'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold ${
            isTopThree ? rankIcons[index].bgColor : 'bg-secondary'
          }`}
        >
          {RankIcon ? (
            <RankIcon className={`w-5 h-5 ${rankIcons[index].color}`} />
          ) : (
            <span className="text-muted-foreground">{index + 1}</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={entry.avatar_url || ''} />
            <AvatarFallback className="bg-secondary font-display">
              {entry.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate">
                {entry.display_name || 'Anonymous'}
              </span>
              {entry.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-muted-foreground truncate">@{entry.username || 'user'}</span>
              <Badge className={`text-xs ${tierConfig[entry.tier || 'participant'].color}`}>
                {tierConfig[entry.tier || 'participant'].label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-display font-bold text-lg ${metricConfig[metric].accent}`}>
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{metricConfig[metric].valueLabel}</p>
        </div>
      </Link>
    );
  };

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[3]} />
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Ranking Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            Reputation measures trust and quality over time, not just short-term spikes.
          </div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            Engagement reflects how much real response your content creates across Herald.
          </div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            Points reflect earned participation and should follow the same trust rules shown on the wallet page.
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading && reputationLeaders.length === 0) {
    return (
      <MainLayout rightSidebar={rightSidebar}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={() => void fetchLeaderboards()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Track who is leading Herald by trust, engagement, and earned participation.
            </p>
          </div>

          {(userRank || userPercentile || userTotalUsers) && (
            <Card className="bg-card border-primary min-w-[260px]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your standing</p>
                    <p className="font-display font-bold text-xl text-foreground">
                      {userRank ? `#${userRank}` : 'Unranked'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-muted-foreground">Percentile</p>
                    <p className="mt-1 font-display font-semibold text-foreground">
                      {userPercentile !== null ? `${userPercentile}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-muted-foreground">Users ranked</p>
                    <p className="mt-1 font-display font-semibold text-foreground">
                      {userTotalUsers?.toLocaleString() || '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ metric, config, leader }) => {
            const Icon = config.icon;
            return (
              <Card
                key={metric}
                className={`bg-card border-border transition-colors ${
                  activeMetric === metric ? 'border-primary/40 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${config.accent}`} />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    {leader && (
                      <Badge variant="outline" className="text-xs">
                        #{leader.rank || 1}
                      </Badge>
                    )}
                  </div>

                  {leader ? (
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                      <p className="font-medium text-foreground">{leader.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{leader.username}</p>
                      <p className={`mt-2 font-display text-2xl font-bold ${config.accent}`}>
                        {config.value(leader).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                      {config.empty}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs
          value={activeMetric}
          onValueChange={(value) => setActiveMetric(value as MetricKey)}
          className="w-full"
        >
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

          {(Object.keys(metricConfig) as MetricKey[]).map((metric) => (
            <TabsContent key={metric} value={metric} className="mt-6 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display flex items-center gap-2">
                    {metric === 'reputation' && <TrendingUp className="w-5 h-5 text-primary" />}
                    {metric === 'engagement' && <Heart className="w-5 h-5 text-rose-500" />}
                    {metric === 'points' && <Sparkles className="w-5 h-5 text-primary" />}
                    {metricConfig[metric].label}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{metricConfig[metric].description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leadersByMetric[metric].length === 0 ? (
                    <div className="rounded-2xl border border-border bg-secondary/20 p-8 text-center text-muted-foreground">
                      {metricConfig[metric].empty}
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-3 gap-4">
                        {leadersByMetric[metric].slice(0, 3).map((leader, index) => {
                          const RankIcon = rankIcons[index].icon;
                          return (
                            <Card
                              key={`${metric}-podium-${leader.user_id}`}
                              className={`bg-card border-border relative overflow-hidden ${
                                index === 0 ? 'md:scale-[1.02]' : ''
                              }`}
                            >
                              {index === 0 && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary" />
                              )}
                              <CardContent className="p-6 text-center">
                                <div
                                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${rankIcons[index].bgColor}`}
                                >
                                  <RankIcon className={`w-7 h-7 ${rankIcons[index].color}`} />
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
                                <p className={`font-display font-bold text-2xl mt-2 ${metricConfig[metric].accent}`}>
                                  {metricConfig[metric].value(leader).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">{metricConfig[metric].valueLabel}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="space-y-2">
                        {leadersByMetric[metric].map((entry, index) =>
                          renderLeaderboardEntry(entry, index, metric)
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {metric === 'points' && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      How the Points Leaderboard Should Be Read
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                      This ranking should reflect earned participation across posting, communities, live, causes, and store activity.
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                      Pending rewards should not inflate rank until they pass trust, quality, and settlement checks.
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                      Strong quality signals should matter more than raw activity volume, so one spammy behavior cannot dominate the leaderboard.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
