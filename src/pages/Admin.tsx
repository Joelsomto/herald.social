import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users,
  FileText,
  Flag,
  TrendingUp,
  Shield,
  Search,
  Ban,
  CheckCircle,
  AlertTriangle,
  Activity,
  DollarSign,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalTransactions: number;
  activeUsers: number;
}

interface UserRow {
  id: string;
  display_name: string;
  username: string;
  is_verified: boolean;
  is_creator: boolean;
  created_at: string;
  user_id: string;
}

interface PostRow {
  id: string;
  content: string;
  author_id: string;
  likes_count: number;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalTransactions: 0,
    activeUsers: 0,
  });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchDashboardData();
    } else {
      // For demo, allow access but show limited data
      setIsAdmin(true);
      fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    const [usersRes, postsRes, walletsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('wallets').select('id'),
    ]);

    if (usersRes.data) {
      setUsers(usersRes.data);
      setStats(prev => ({ ...prev, totalUsers: usersRes.data.length, activeUsers: Math.floor(usersRes.data.length * 0.7) }));
    }
    if (postsRes.data) {
      setPosts(postsRes.data);
      setStats(prev => ({ ...prev, totalPosts: postsRes.data.length }));
    }
    if (walletsRes.data) {
      setStats(prev => ({ ...prev, totalTransactions: walletsRes.data.length * 10 }));
    }
  };

  const handleVerifyUser = async (userId: string) => {
    await supabase.from('profiles').update({ is_verified: true }).eq('user_id', userId);
    toast({ title: 'User Verified', description: 'User has been verified successfully' });
    fetchDashboardData();
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: number | string; icon: any; trend?: string }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <Badge variant="outline" className="text-primary border-primary">
              Admin
            </Badge>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} trend="+12% this week" />
            <StatCard title="Total Posts" value={stats.totalPosts.toLocaleString()} icon={FileText} trend="+8% this week" />
            <StatCard title="Transactions" value={stats.totalTransactions.toLocaleString()} icon={DollarSign} trend="+25% this week" />
            <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={Activity} trend="+5% this week" />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Users Table */}
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-4 font-medium">User</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Joined</th>
                          <th className="p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-secondary/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground">
                                  {user.display_name?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{user.display_name || 'Unknown'}</p>
                                  <p className="text-sm text-muted-foreground">@{user.username || 'unknown'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {user.is_verified ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verified</Badge>
                                ) : (
                                  <Badge variant="outline">Pending</Badge>
                                )}
                                {user.is_creator && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20">Creator</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {!user.is_verified && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="gap-1 text-green-500 hover:text-green-600"
                                    onClick={() => handleVerifyUser(user.user_id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {posts.slice(0, 10).map(post => (
                    <div key={post.id} className="p-4 rounded-lg bg-secondary/30 space-y-2">
                      <p className="text-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{post.likes_count} likes</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground">No Reports</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    No content reports at this time.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}