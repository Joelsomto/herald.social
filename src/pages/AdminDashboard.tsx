import { Fragment, useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/herald/MainLayout';
import { apiGet, apiPost, apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  Shield,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  Ban,
  Lock,
  Loader2,
  Search,
  AlertCircle,
  RefreshCw,
  BadgeCheck,
  MessageCircle,
  Radio,
  Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminRole {
  is_admin: boolean;
  is_super_admin: boolean;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'analytics_viewer' | 'ads_manager' | 'user';
  roles: string[];
  permissions: string[];
  source?: 'assignment' | 'django_superuser' | 'django_staff' | null;
}

interface AdminStats {
  total_users: number;
  total_posts: number;
  active_users_today: number;
  total_wallets: number;
  total_httn_points: number;
  stats_collected_at: string;
}

interface AnalyticsPoint {
  date: string;
  users: number;
  posts: number;
  messages: number;
  streams: number;
}

interface AnalyticsPost {
  id: string;
  content: string;
  author_username?: string;
  author_display_name?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  total_engagement: number;
  created_at: string;
}

interface AdminAnalytics {
  window_days: number;
  series: AnalyticsPoint[];
  engagement_totals: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  top_posts: AnalyticsPost[];
  generated_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  created_at: string;
  admin_role?: AdminRole['role'];
  is_admin?: boolean;
  admin_permissions?: string[];
}

interface Post {
  id: string;
  content: string;
  author_username?: string;
  author_display_name?: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface PaginatedUsers {
  data: UserProfile[];
  pagination: Pagination;
}

interface PaginatedPosts {
  data: Post[];
  pagination: Pagination;
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl text-foreground">Access Denied</h1>
          <p className="text-muted-foreground max-w-sm">
            You do not have permission to view this page. Admin privileges are required.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/feed">Back to Feed</Link>
        </Button>
      </div>
    </MainLayout>
  );
}

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

// ─── Ban Dialog (inline) ──────────────────────────────────────────────────────

interface BanState {
  userId: string;
  reason: string;
  duration_days: number;
}

const ROLE_OPTIONS: Array<{ value: AdminRole['role']; label: string }> = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'support', label: 'Support' },
  { value: 'analytics_viewer', label: 'Analytics Viewer' },
  { value: 'ads_manager', label: 'Ads Manager' },
  { value: 'user', label: 'No Admin Role' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const formatCompactNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }, []);

  const formatSeriesLabel = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // Access guard state
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const hasPermission = useCallback((permission: string) => {
    return adminRole?.is_super_admin || adminRole?.permissions?.includes(permission) || false;
  }, [adminRole]);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Users tab
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [banState, setBanState] = useState<BanState | null>(null);
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Posts tab
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPagination, setPostsPagination] = useState<Pagination | null>(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsSearch, setPostsSearch] = useState('');
  const [postsLoading, setPostsLoading] = useState(false);

  // Debounce timers
  const usersDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canViewAnalytics = hasPermission('analytics.view');
  const canViewUsers = hasPermission('users.view');
  const canVerifyUsers = hasPermission('users.verify');
  const canBanUsers = hasPermission('users.ban');
  const canViewPosts = hasPermission('posts.view');
  const canManageRoles = hasPermission('roles.manage');
  const availableTabs = [
    canViewAnalytics ? 'analytics' : null,
    canViewUsers ? 'users' : null,
    canViewPosts ? 'posts' : null,
  ].filter(Boolean) as Array<'analytics' | 'users' | 'posts'>;
  const defaultTab = availableTabs[0] ?? 'analytics';

  // ── Check admin role on mount ──
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const data = await apiGet<AdminRole>('/admin/me/role/');
        setAdminRole(data);
        setIsAdmin(data.is_admin);
      } catch {
        setAdminRole(null);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };
    check();
  }, [user]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiGet<AdminStats>('/admin/stats/');
      setStats(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load stats', variant: 'destructive' });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiGet<AdminAnalytics>('/admin/analytics/?days=14');
      setAnalytics(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [toast]);

  // ── Fetch users ──
  const fetchUsers = useCallback(async (page: number, search: string) => {
    setUsersLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) q.append('search', search);
      const data = await apiGet<PaginatedUsers>(`/admin/users/?${q.toString()}`);
      setUsers(data.data ?? []);
      setUsersPagination(data.pagination ?? null);
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  // ── Fetch posts ──
  const fetchPosts = useCallback(async (page: number, search: string) => {
    setPostsLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) q.append('search', search);
      const data = await apiGet<PaginatedPosts>(`/admin/posts/?${q.toString()}`);
      setPosts(data.data ?? []);
      setPostsPagination(data.pagination ?? null);
    } catch {
      toast({ title: 'Error', description: 'Failed to load posts', variant: 'destructive' });
    } finally {
      setPostsLoading(false);
    }
  }, [toast]);

  // ── Initial data load after role confirmed ──
  useEffect(() => {
    if (!isAdmin) return;
    if (canViewAnalytics) {
      fetchStats();
      fetchAnalytics();
    }
    if (canViewUsers) {
      fetchUsers(1, '');
    }
    if (canViewPosts) {
      fetchPosts(1, '');
    }
  }, [isAdmin, canViewAnalytics, canViewUsers, canViewPosts, fetchStats, fetchAnalytics, fetchUsers, fetchPosts]);

  // ── Debounced user search ──
  useEffect(() => {
    if (!canViewUsers) return;
    if (usersDebounce.current) clearTimeout(usersDebounce.current);
    usersDebounce.current = setTimeout(() => {
      setUsersPage(1);
      fetchUsers(1, usersSearch);
    }, 400);
    return () => {
      if (usersDebounce.current) clearTimeout(usersDebounce.current);
    };
  }, [usersSearch, fetchUsers, canViewUsers]);

  // ── Debounced post search ──
  useEffect(() => {
    if (!canViewPosts) return;
    if (postsDebounce.current) clearTimeout(postsDebounce.current);
    postsDebounce.current = setTimeout(() => {
      setPostsPage(1);
      fetchPosts(1, postsSearch);
    }, 400);
    return () => {
      if (postsDebounce.current) clearTimeout(postsDebounce.current);
    };
  }, [postsSearch, fetchPosts, canViewPosts]);

  // ── Page change effects ──
  useEffect(() => {
    if (isAdmin && canViewUsers) fetchUsers(usersPage, usersSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage, isAdmin, canViewUsers]);

  useEffect(() => {
    if (isAdmin && canViewPosts) fetchPosts(postsPage, postsSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postsPage, isAdmin, canViewPosts]);

  // ── Actions ──
  const handleVerify = async (userId: string) => {
    setVerifyingId(userId);
    try {
      await apiPost(`/admin/users/${userId}/verify/`, { body: {} });
      toast({ title: 'User Verified', description: 'User has been verified successfully.' });
      fetchUsers(usersPage, usersSearch);
    } catch {
      toast({ title: 'Error', description: 'Failed to verify user', variant: 'destructive' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleBanSubmit = async () => {
    if (!banState) return;
    setBanSubmitting(true);
    try {
      await apiPost(`/admin/users/${banState.userId}/ban/`, {
        body: { reason: banState.reason, duration_days: banState.duration_days },
      });
      toast({ title: 'User Banned', description: `User banned for ${banState.duration_days} days.` });
      setBanState(null);
      fetchUsers(usersPage, usersSearch);
    } catch {
      toast({ title: 'Error', description: 'Failed to ban user', variant: 'destructive' });
    } finally {
      setBanSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, nextRole: AdminRole['role']) => {
    setUpdatingRoleId(userId);
    try {
      if (nextRole === 'user') {
        await apiRequest(`/admin/roles/${userId}/`, { method: 'DELETE' });
      } else {
        await apiPost('/admin/roles/', { body: { user_id: userId, role: nextRole } });
      }
      toast({ title: 'Role updated', description: 'Admin role saved successfully.' });
      fetchUsers(usersPage, usersSearch);
    } catch {
      toast({ title: 'Error', description: 'Failed to update admin role', variant: 'destructive' });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      ...(canViewAnalytics ? [fetchStats(), fetchAnalytics()] : []),
      ...(canViewUsers ? [fetchUsers(usersPage, usersSearch)] : []),
      ...(canViewPosts ? [fetchPosts(postsPage, postsSearch)] : []),
    ]);
  };

  // ── Render states ──
  if (checkingRole) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return <AccessDenied />;
  if (!availableTabs.length) return <AccessDenied />;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="font-display font-bold text-xl text-foreground">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAll}
                disabled={statsLoading || analyticsLoading || usersLoading || postsLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    statsLoading || analyticsLoading || usersLoading || postsLoading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              </Button>
              <Badge variant="outline" className="text-primary border-primary">
                {ROLE_OPTIONS.find((item) => item.value === adminRole?.role)?.label ?? 'Admin'}
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Stats Cards */}
          {canViewAnalytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading || !stats ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="text-2xl font-display font-bold text-foreground mt-1">
                            {stats.total_users.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Posts</p>
                          <p className="text-2xl font-display font-bold text-foreground mt-1">
                            {stats.total_posts.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Today</p>
                          <p className="text-2xl font-display font-bold text-foreground mt-1">
                            {stats.active_users_today.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total HTTN Points</p>
                          <p className="text-2xl font-display font-bold text-foreground mt-1">
                            {stats.total_httn_points.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <BadgeCheck className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="bg-secondary">
              {canViewAnalytics && (
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Analytics
                </TabsTrigger>
              )}
              {canViewUsers && (
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Users
                </TabsTrigger>
              )}
              {canViewPosts && (
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Posts
                </TabsTrigger>
              )}
            </TabsList>

            {canViewAnalytics && (
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Likes</p>
                        <p className="text-2xl font-display font-bold text-foreground mt-1">
                          {analyticsLoading || !analytics
                            ? '...'
                            : formatCompactNumber(analytics.engagement_totals.likes)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BadgeCheck className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Comments</p>
                        <p className="text-2xl font-display font-bold text-foreground mt-1">
                          {analyticsLoading || !analytics
                            ? '...'
                            : formatCompactNumber(analytics.engagement_totals.comments)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Streams Created</p>
                        <p className="text-2xl font-display font-bold text-foreground mt-1">
                          {analyticsLoading || !analytics
                            ? '...'
                            : formatCompactNumber(
                                analytics.series.reduce((sum, point) => sum + point.streams, 0)
                              )}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Post Views</p>
                        <p className="text-2xl font-display font-bold text-foreground mt-1">
                          {analyticsLoading || !analytics
                            ? '...'
                            : formatCompactNumber(analytics.engagement_totals.views)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Growth Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {analyticsLoading || !analytics ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatSeriesLabel}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <RechartsTooltip
                            labelFormatter={formatSeriesLabel}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="New users"
                          />
                          <Line
                            type="monotone"
                            dataKey="posts"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            name="Posts"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Conversation Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {analyticsLoading || !analytics ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatSeriesLabel}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <RechartsTooltip
                            labelFormatter={formatSeriesLabel}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '12px',
                            }}
                          />
                          <Bar
                            dataKey="messages"
                            fill="#f59e0b"
                            radius={[8, 8, 0, 0]}
                            name="Messages"
                          />
                          <Bar
                            dataKey="streams"
                            fill="#8b5cf6"
                            radius={[8, 8, 0, 0]}
                            name="Streams"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Top Posts</CardTitle>
                  {analytics?.generated_at ? (
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(analytics.generated_at).toLocaleString()}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  {analyticsLoading || !analytics ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    ))
                  ) : analytics.top_posts.length === 0 ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No post activity yet for this window.
                      </p>
                    </div>
                  ) : (
                    analytics.top_posts.map((post) => (
                      <div key={post.id} className="rounded-xl border border-border p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {post.author_display_name || post.author_username || 'Unknown user'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{post.author_username || 'unknown'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {formatCompactNumber(post.total_engagement)} engagement
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {post.content?.trim() ? post.content : 'No post text'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{post.likes_count} likes</span>
                          <span>{post.comments_count} comments</span>
                          <span>{post.shares_count} shares</span>
                          <span>{post.views_count} views</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* ── Users Tab ── */}
            {canViewUsers && (
            <TabsContent value="users" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No users found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr className="text-left text-sm text-muted-foreground">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium hidden lg:table-cell">Role</th>
                            <th className="p-4 font-medium hidden sm:table-cell">Verified</th>
                            <th className="p-4 font-medium hidden md:table-cell">Joined</th>
                            <th className="p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {users.map((u) => (
                            <Fragment key={u.id}>
                              <tr className="hover:bg-secondary/30">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-9 h-9">
                                      <AvatarImage src={u.avatar_url ?? undefined} />
                                      <AvatarFallback>
                                        {(u.display_name || u.username || '?')[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-foreground text-sm">
                                        {u.display_name || u.username}
                                      </p>
                                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 hidden lg:table-cell">
                                  {canManageRoles ? (
                                    <Select
                                      value={u.admin_role ?? 'user'}
                                      onValueChange={(value) => handleRoleChange(u.id, value as AdminRole['role'])}
                                      disabled={updatingRoleId === u.id}
                                    >
                                      <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ROLE_OPTIONS.map((roleOption) => (
                                          <SelectItem key={roleOption.value} value={roleOption.value}>
                                            {roleOption.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      {ROLE_OPTIONS.find((item) => item.value === (u.admin_role ?? 'user'))?.label ?? 'User'}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                  {u.is_verified ? (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Unverified</Badge>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1">
                                    {!u.is_verified && canVerifyUsers && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-500 hover:text-green-600 h-8 px-2"
                                        onClick={() => handleVerify(u.id)}
                                        disabled={verifyingId === u.id}
                                        title="Verify user"
                                      >
                                        {verifyingId === u.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    {canBanUsers && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive h-8 px-2"
                                        onClick={() =>
                                          setBanState({
                                            userId: u.id,
                                            reason: '',
                                            duration_days: 30,
                                          })
                                        }
                                        title="Ban user"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {/* Inline ban confirm row */}
                              {banState?.userId === u.id && (
                                <tr className="bg-destructive/5">
                                  <td colSpan={5} className="p-4">
                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                      <Input
                                        placeholder="Reason for ban"
                                        value={banState.reason}
                                        onChange={(e) =>
                                          setBanState((prev) =>
                                            prev ? { ...prev, reason: e.target.value } : prev
                                          )
                                        }
                                        className="flex-1 h-8 text-sm"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min={1}
                                          value={banState.duration_days}
                                          onChange={(e) =>
                                            setBanState((prev) =>
                                              prev
                                                ? { ...prev, duration_days: parseInt(e.target.value) || 30 }
                                                : prev
                                            )
                                          }
                                          className="w-20 h-8 text-sm"
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={handleBanSubmit}
                                          disabled={banSubmitting || !banState.reason}
                                          className="h-8"
                                        >
                                          {banSubmitting ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            'Confirm Ban'
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setBanState(null)}
                                          className="h-8"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Users Pagination */}
              {usersPagination && usersPagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {usersPagination.page} of {usersPagination.total_pages} ({usersPagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPage >= usersPagination.total_pages}
                      onClick={() => setUsersPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            )}

            {/* ── Posts Tab ── */}
            {canViewPosts && (
            <TabsContent value="posts" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={postsSearch}
                  onChange={(e) => setPostsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Posts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {postsLoading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No posts found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {posts.map((post) => (
                        <div key={post.id} className="p-4 hover:bg-secondary/20">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                @{post.author_username || 'unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {post.content?.slice(0, 50) || ''}
                                {(post.content?.length ?? 0) > 50 ? '…' : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </p>
                              <div className="flex gap-3 text-xs text-muted-foreground justify-end">
                                <span>{post.likes_count ?? 0} likes</span>
                                <span>{post.comments_count ?? 0} comments</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Posts Pagination */}
              {postsPagination && postsPagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {postsPagination.page} of {postsPagination.total_pages} ({postsPagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={postsPage <= 1}
                      onClick={() => setPostsPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={postsPage >= postsPagination.total_pages}
                      onClick={() => setPostsPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
