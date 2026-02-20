import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  BadgeCheck,
  Edit2,
  Sparkles,
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  Calendar,
  Save,
  X,
  MapPin,
  Link as LinkIcon,
  ArrowLeft,
  Building2,
  Church,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from '@/components/herald/AvatarUpload';
import { useNavigate } from 'react-router-dom';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  tier: string | null;
  reputation: number | null;
  is_verified: boolean;
  is_creator: boolean;
  total_engagement: number;
  followers_count: number;
  following_count: number;
  created_at: string;
  account_type: string | null;
  organization_name: string | null;
  business_category: string | null;
}

interface WalletData {
  httn_points: number;
  httn_tokens: number;
}

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  httn_earned: number;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    account_type: 'normal',
    organization_name: '',
    business_category: '',
  });

  const VERIFICATION_THRESHOLD = 10000;
  const ENGAGEMENT_THRESHOLD = 100;

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    const [profileRes, walletRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallets').select('httn_points, httn_tokens').eq('user_id', user.id).maybeSingle(),
      supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as ProfileData);
      setEditForm({
        display_name: profileRes.data.display_name || '',
        username: profileRes.data.username || '',
        bio: profileRes.data.bio || '',
        account_type: profileRes.data.account_type || 'normal',
        organization_name: profileRes.data.organization_name || '',
        business_category: profileRes.data.business_category || '',
      });
    }
    if (walletRes.data) setWallet(walletRes.data);
    if (postsRes.data) setPosts(postsRes.data);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        username: editForm.username,
        bio: editForm.bio,
        account_type: editForm.account_type,
        organization_name: editForm.account_type !== 'normal' ? editForm.organization_name : null,
        business_category: editForm.account_type === 'business' ? editForm.business_category : null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setIsEditing(false);
      fetchProfileData();
    }
  };

  const handleAvatarChange = (newUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newUrl });
    }
  };

  const toggleCreatorMode = async () => {
    if (!user || !profile) return;

    const newValue = !profile.is_creator;
    const { error } = await supabase
      .from('profiles')
      .update({ is_creator: newValue })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update creator mode',
        variant: 'destructive',
      });
    } else {
      setProfile({ ...profile, is_creator: newValue });
      toast({
        title: newValue ? 'Creator Mode Enabled' : 'Creator Mode Disabled',
        description: newValue
          ? 'You now have access to creator dashboard and tools!'
          : 'Switched back to normal profile',
      });
    }
  };

  const verificationProgress = wallet
    ? Math.min((wallet.httn_points / VERIFICATION_THRESHOLD) * 100, 100)
    : 0;

  const engagementProgress = profile
    ? Math.min((profile.total_engagement / ENGAGEMENT_THRESHOLD) * 100, 100)
    : 0;

  const canGetVerified = wallet && profile && 
    wallet.httn_points >= VERIFICATION_THRESHOLD && 
    profile.total_engagement >= ENGAGEMENT_THRESHOLD;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[2]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="min-h-screen">
        {/* Header with back button */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-6 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">
                {profile?.display_name || 'Profile'}
              </h1>
              <p className="text-xs text-muted-foreground">{posts.length} posts</p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/30 via-primary/20 to-herald-violet/20" />

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {/* Avatar & Edit Button */}
          <div className="flex justify-between items-start -mt-16 mb-3">
            {user && (
              <div className="border-4 border-background rounded-full">
                <AvatarUpload
                  userId={user.id}
                  currentAvatarUrl={profile?.avatar_url || null}
                  displayName={profile?.display_name || null}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                />
              </div>
            )}
            
            {!isEditing ? (
              <Button 
                variant="outline" 
                className="mt-16 rounded-full font-semibold"
                onClick={() => setIsEditing(true)}
              >
                Edit profile
              </Button>
            ) : (
              <div className="flex gap-2 mt-16">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="gold" onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Name & Handle */}
          <div className="mb-3">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Display Name</Label>
                  <Input
                    value={editForm.display_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Display name"
                    className="text-xl font-display font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Username</Label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Account Type</Label>
                  <Select
                    value={editForm.account_type}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, account_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Normal Account
                        </div>
                      </SelectItem>
                      <SelectItem value="church">
                        <div className="flex items-center gap-2">
                          <Church className="w-4 h-4" />
                          Church / Group
                        </div>
                      </SelectItem>
                      <SelectItem value="business">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Business Account
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Name - shown for Church and Business */}
                {(editForm.account_type === 'church' || editForm.account_type === 'business') && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">
                      {editForm.account_type === 'church' ? 'Organization / Ministry Name' : 'Business Name'}
                    </Label>
                    <Input
                      value={editForm.organization_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, organization_name: e.target.value }))}
                      placeholder={editForm.account_type === 'church' ? 'Enter church or organization name' : 'Enter business name'}
                    />
                  </div>
                )}

                {/* Business Category - shown only for Business */}
                {editForm.account_type === 'business' && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Business Category</Label>
                    <Select
                      value={editForm.business_category}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, business_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail & E-commerce</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance & Banking</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="entertainment">Entertainment & Media</SelectItem>
                        <SelectItem value="hospitality">Hospitality & Tourism</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="consulting">Consulting & Services</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    {profile?.display_name || 'Anonymous'}
                  </h2>
                  {profile?.is_verified && profile?.is_creator && (
                    <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
                  )}
                  {profile?.is_verified && !profile?.is_creator && (
                    <BadgeCheck className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
                
                {/* Show account type badge and org info */}
                {profile?.account_type && profile.account_type !== 'normal' && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {profile.account_type === 'church' ? (
                        <Church className="w-3 h-3" />
                      ) : (
                        <Briefcase className="w-3 h-3" />
                      )}
                      {profile.account_type === 'church' ? 'Church / Group' : 'Business'}
                    </Badge>
                    {profile.organization_name && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {profile.organization_name}
                      </span>
                    )}
                    {profile.business_category && (
                      <Badge variant="secondary" className="text-xs">
                        {profile.business_category.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bio */}
          {isEditing ? (
            <Textarea
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell the world about yourself..."
              className="mb-3"
            />
          ) : (
            <p className="text-foreground mb-3">
              {profile?.bio || 'No bio yet.'}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="gold-text font-semibold">{wallet?.httn_points.toLocaleString() || 0}</span> HTTN
            </span>
          </div>

          {/* Following / Followers */}
          <div className="flex gap-4 text-sm">
            <span>
              <span className="font-semibold text-foreground">{profile?.following_count || 0}</span>
              <span className="text-muted-foreground"> Following</span>
            </span>
            <span>
              <span className="font-semibold text-foreground">{profile?.followers_count || 0}</span>
              <span className="text-muted-foreground"> Followers</span>
            </span>
          </div>

          {/* Creator Mode Toggle */}
          <Card className="mt-4 bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Creator Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enable to access creator dashboard & tools
                  </p>
                </div>
                <Switch
                  checked={profile?.is_creator || false}
                  onCheckedChange={toggleCreatorMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Verification Progress */}
          {!profile?.is_verified && (
            <Card className="mt-4 bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  Path to Verification
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">HTTN Points</span>
                    <span className="text-foreground">{wallet?.httn_points.toLocaleString() || 0} / {VERIFICATION_THRESHOLD.toLocaleString()}</span>
                  </div>
                  <Progress value={verificationProgress} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="text-foreground">{profile?.total_engagement || 0} / {ENGAGEMENT_THRESHOLD}</span>
                  </div>
                  <Progress value={engagementProgress} className="h-1.5" />
                </div>
                {canGetVerified && (
                  <Button variant="gold" className="w-full mt-2">
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Claim Verification
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="replies" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Replies
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Media
            </TabsTrigger>
            <TabsTrigger 
              value="likes" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No posts yet. Start creating content!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <article key={post.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground flex-shrink-0">
                        {profile?.display_name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{profile?.display_name}</span>
                          {profile?.is_verified && profile?.is_creator && (
                            <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                          )}
                          <span className="text-muted-foreground">@{profile?.username}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-sm">
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-foreground mt-1">{post.content}</p>
                        
                        {post.media_url && (
                          <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                            <img src={post.media_url} alt="" className="w-full max-h-[300px] object-cover" />
                          </div>
                        )}

                        {post.httn_earned > 0 && (
                          <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium gold-text">+{post.httn_earned} HTTN</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 max-w-md text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.comments_count || ''}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                            <Repeat2 className="w-4 h-4" />
                            <span className="text-sm">{post.shares_count || ''}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{post.likes_count || ''}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              Replies will appear here
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <div className="grid grid-cols-3 gap-0.5">
              {posts.filter(p => p.media_url).map((post) => (
                <div key={post.id} className="aspect-square">
                  <img src={post.media_url!} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {posts.filter(p => p.media_url).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No media posts yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              Liked posts will appear here
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
