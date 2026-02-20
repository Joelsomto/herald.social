import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Calendar,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ContentInsights } from '@/components/herald/ContentInsights';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface WalletData {
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
}

interface ProfileData {
  display_name: string;
  reputation: number;
  tier: string;
}

interface EarningsData {
  amount: number;
  source: string;
  created_at: string;
}

const COLORS = ['hsl(45, 93%, 58%)', 'hsl(270, 70%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 71%, 45%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [walletRes, profileRes, earningsRes, postsRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('earnings_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (walletRes.data) setWallet(walletRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (earningsRes.data) setEarnings(earningsRes.data);
    if (postsRes.data) setPosts(postsRes.data);
  };

  // Generate chart data
  const engagementData = [
    { name: 'Mon', likes: 45, comments: 12, shares: 8 },
    { name: 'Tue', likes: 52, comments: 18, shares: 15 },
    { name: 'Wed', likes: 38, comments: 10, shares: 6 },
    { name: 'Thu', likes: 78, comments: 25, shares: 20 },
    { name: 'Fri', likes: 92, comments: 32, shares: 28 },
    { name: 'Sat', likes: 110, comments: 45, shares: 35 },
    { name: 'Sun', likes: 85, comments: 28, shares: 22 },
  ];

  const earningsChartData = [
    { name: 'Week 1', earned: 250 },
    { name: 'Week 2', earned: 420 },
    { name: 'Week 3', earned: 380 },
    { name: 'Week 4', earned: 560 },
  ];

  const audienceData = [
    { name: 'Creators', value: 35 },
    { name: 'Participants', value: 45 },
    { name: 'Partners', value: 15 },
    { name: 'Heralds', value: 5 },
  ];

  const totalEngagement = posts.reduce((acc, post) => 
    acc + post.likes_count + post.comments_count + post.shares_count, 0
  );

  const totalEarned = posts.reduce((acc, post) => acc + post.httn_earned, 0);

  const stats = [
    {
      title: 'Total HTTN Points',
      value: wallet?.httn_points.toLocaleString() || '0',
      change: '+12.5%',
      positive: true,
      icon: Sparkles,
    },
    {
      title: 'HTTN Tokens',
      value: Number(wallet?.httn_tokens || 0).toFixed(2),
      change: '+8.2%',
      positive: true,
      icon: Wallet,
    },
    {
      title: 'Total Engagement',
      value: totalEngagement.toLocaleString(),
      change: '+24.8%',
      positive: true,
      icon: Heart,
    },
    {
      title: 'Content Earned',
      value: `${totalEarned.toLocaleString()} HTTN`,
      change: '+15.3%',
      positive: true,
      icon: TrendingUp,
    },
  ];

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[Math.floor(Math.random() * verticalAds.length)]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground">Track your performance and earnings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </Button>
            <Button variant="gold" size="sm" className="gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    stat.positive ? 'text-success' : 'text-destructive'
                  }`}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Content Insights */}
        <ContentInsights posts={posts} engagementData={engagementData} />

        {/* Charts */}
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>

          <TabsContent value="engagement" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Engagement Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                      <XAxis dataKey="name" stroke="hsl(220, 15%, 55%)" />
                      <YAxis stroke="hsl(220, 15%, 55%)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 30%, 16%)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="likes" fill="hsl(45, 93%, 58%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comments" fill="hsl(270, 70%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="shares" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">Likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(270, 70%, 60%)' }} />
                    <span className="text-sm text-muted-foreground">Comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }} />
                    <span className="text-sm text-muted-foreground">Shares</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Earnings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earningsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                      <XAxis dataKey="name" stroke="hsl(220, 15%, 55%)" />
                      <YAxis stroke="hsl(220, 15%, 55%)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 30%, 16%)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="earned" 
                        stroke="hsl(45, 93%, 58%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(45, 93%, 58%)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Earnings sources */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {[
                    { source: 'Content Creation', amount: 450, icon: Eye },
                    { source: 'Engagement', amount: 280, icon: Heart },
                    { source: 'Tips Received', amount: 120, icon: Sparkles },
                    { source: 'Task Rewards', amount: 180, icon: TrendingUp },
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                      </div>
                      <p className="font-display font-semibold text-foreground">{item.amount} HTTN</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Audience Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={audienceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {audienceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(222, 47%, 10%)', 
                            border: '1px solid hsl(222, 30%, 16%)',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {audienceData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Audience Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Engagement Rate', value: 8.5, target: 10 },
                    { label: 'Follower Growth', value: 12, target: 15 },
                    { label: 'Content Reach', value: 75, target: 100 },
                    { label: 'Conversion Rate', value: 4.2, target: 5 },
                  ].map((metric, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="text-foreground font-medium">{metric.value}%</span>
                      </div>
                      <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Content Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display">Recent Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No posts yet. Start creating content!</p>
              ) : (
                posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{post.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Share2 className="w-4 h-4" />
                        {post.shares_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm gold-text">
                        <Sparkles className="w-4 h-4" />
                        {post.httn_earned}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}