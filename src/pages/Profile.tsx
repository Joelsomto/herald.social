import { useEffect, useRef, useState } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import { ProfileReplyCard } from '@/components/herald/ProfileReplyCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BadgeCheck,
  Camera,
  Heart,
  MessageCircle,
  Repeat2,
  Sparkles,
  Calendar,
  MapPin,
  Link as LinkIcon,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser, updateCurrentUser, getCurrentUserReplies, getCurrentUserPosts, type UserReply } from '@/lib/api/users';
import { uploadAvatar, uploadCover } from '@/lib/api/users';
import { getCurrentUserWallet } from '@/lib/api/wallets';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Label } from '@/components/ui/label';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  website: string | null;
  tier: string | null;
  reputation: number | null;
  is_verified: boolean;
  is_creator: boolean;
  total_engagement: number;
  followers_count: number;
  following_count: number;
  created_at: string;
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
  bookmarks_count?: number;
  httn_earned: number;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
  author_id?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  is_creator?: boolean;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
  profile_reposted?: boolean;
  profile_reposted_at?: string | null;
}

function mapPost(p: any): Post {
  return {
    ...p,
    media_url: p.media_url || null,
    media_type: p.media_type || null,
    bookmarks_count: p.bookmarks_count ?? 0,
    author_id: typeof p.author_id === 'string' ? p.author_id : p.author_id?.id || p.author?.id,
    username: p.username || p.author?.username || p.author_id?.username,
    display_name: p.display_name || p.author?.display_name || p.author_id?.display_name,
    avatar_url: p.avatar_url || p.author?.avatar_url || p.author_id?.avatar_url || null,
    is_verified: p.is_verified || p.author?.is_verified || p.author_id?.is_verified || false,
    is_creator: p.is_creator || p.author?.is_creator || p.author_id?.is_creator || false,
    is_liked: p.is_liked ?? false,
    is_reposted: p.is_reposted ?? false,
    is_bookmarked: p.is_bookmarked ?? false,
  };
}

function normalizeWebsiteInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.includes('://') ? trimmed : `https://${trimmed}`;
}

function formatWebsiteLabel(value?: string | null) {
  if (!value) return '';
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<UserReply[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
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
    setProfileLoading(true);
    
    try {
      const [profileData, walletData, postsResponse] = await Promise.all([
        getCurrentUser(),
        getCurrentUserWallet(),
        getCurrentUserPosts({ limit: 50 }),
      ]);

      if (profileData) {
        setProfile(profileData as any);
        setEditForm({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
        });
      }
      if (walletData) setWallet(walletData as any);
      setPosts(((postsResponse?.data as any[]) ?? []).map(mapPost));

      const [likesResponse, mediaResponse, repliesResponse] = await Promise.all([
        getCurrentUserPosts({ limit: 50, tab: 'likes' }),
        getCurrentUserPosts({ limit: 50, tab: 'media' }),
        getCurrentUserReplies(),
      ]);

      setLikedPosts(((likesResponse?.data as any[]) ?? []).map(mapPost));
      setMediaPosts(((mediaResponse?.data as any[]) ?? []).map(mapPost));
      setReplies(Array.isArray(repliesResponse) ? repliesResponse : []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    try {
      setSavingProfile(true);
      await updateCurrentUser({
        display_name: editForm.display_name,
        bio: editForm.bio,
        location: editForm.location.trim() || null,
        website: normalizeWebsiteInput(editForm.website) || null,
        ...(removeAvatar ? { avatar_url: null } : {}),
        ...(removeCover ? { cover_url: null } : {}),
      } as any);

      if (avatarFile) {
        const avatarResult = await uploadAvatar(avatarFile);
        if (avatarResult?.avatar_url) {
          setProfile((current) => current ? { ...current, avatar_url: avatarResult.avatar_url } : current);
        }
      }

      if (coverFile) {
        const coverResult = await uploadCover(coverFile);
        if (coverResult?.cover_url) {
          setProfile((current) => current ? { ...current, cover_url: coverResult.cover_url } : current);
        }
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setIsEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(null);
      setCoverPreview(null);
      setRemoveAvatar(false);
      setRemoveCover(false);
      fetchProfileData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (newUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newUrl });
    }
  };

  const beginEditing = () => {
    setIsEditing(true);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreview(null);
    setCoverPreview(null);
    setRemoveAvatar(false);
    setRemoveCover(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreview(null);
    setCoverPreview(null);
    setRemoveAvatar(false);
    setRemoveCover(false);
    if (profile) {
      setEditForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
      });
    }
  };

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: 'avatar' | 'cover'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please choose an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please choose an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    if (kind === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(preview);
      setRemoveAvatar(false);
    } else {
      setCoverFile(file);
      setCoverPreview(preview);
      setRemoveCover(false);
    }
  };

  const displayedAvatar = removeAvatar ? null : (avatarPreview || profile?.avatar_url || null);
  const displayedCover = removeCover ? null : (coverPreview || profile?.cover_url || null);
  const websiteLabel = formatWebsiteLabel(profile?.website);

  const toggleCreatorMode = async () => {
    if (!user || !profile) return;

    const newValue = !profile.is_creator;
    try {
      await updateCurrentUser({ is_creator: newValue });
      setProfile({ ...profile, is_creator: newValue });
      toast({
        title: newValue ? 'Creator Mode Enabled' : 'Creator Mode Disabled',
        description: newValue
          ? 'You now have access to creator dashboard and tools!'
          : 'Switched back to normal profile',
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update creator mode';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
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

  if (profileLoading && !profile) {
    return (
      <MainLayout rightSidebar={rightSidebar}>
        <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }

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
        <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary/30 via-primary/20 to-herald-violet/20 overflow-hidden">
          {displayedCover && (
            <img
              src={displayedCover}
              alt="Profile header"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {/* Avatar & Edit Button */}
          <div className="flex justify-between items-start -mt-16 mb-3">
            {user && (
              <div className="border-4 border-background rounded-full">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                  {displayedAvatar ? (
                    <img src={displayedAvatar} alt={profile?.display_name || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-display font-bold text-foreground">
                      {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              className="mt-16 rounded-full font-semibold"
              onClick={beginEditing}
            >
              Edit profile
            </Button>
          </div>

          {/* Name & Handle */}
          <div className="mb-3">
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
          </div>

          {/* Bio */}
          <p className="text-foreground mb-3">
            {profile?.bio || 'No bio yet.'}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            {profile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {websiteLabel && (
              <a
                href={profile?.website || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                {websiteLabel}
              </a>
            )}
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
                        {post.profile_reposted && (
                          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Repeat2 className="w-3 h-3" />
                            <span>You reposted</span>
                          </div>
                        )}
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
            {replies.length > 0 ? (
              replies.map((reply) => (
                <ProfileReplyCard
                  key={reply.id}
                  author={{
                    displayName: profile?.display_name || 'User',
                    username: profile?.username || 'user',
                    avatar: profile?.avatar_url || null,
                    isVerified: profile?.is_verified,
                    isGoldVerified: profile?.is_verified && profile?.is_creator,
                  }}
                  reply={reply}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No replies yet
              </div>
            )}
        </TabsContent>

        <TabsContent value="media" className="mt-0">
            <div className="grid grid-cols-3 gap-0.5">
              {mediaPosts.map((post) => (
                <div key={post.id} className="aspect-square">
                  <img src={post.media_url!} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {mediaPosts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No media posts yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <TwitterStylePost
                  key={post.id}
                  id={post.id}
                  author={{
                    id: post.author_id || '',
                    displayName: post.display_name || 'User',
                    username: post.username || 'user',
                    avatar: post.avatar_url || null,
                    isVerified: post.is_verified,
                    isGoldVerified: post.is_verified && post.is_creator,
                  }}
                  content={post.content}
                  mediaUrl={post.media_url || undefined}
                  mediaType={post.media_type as 'image' | 'video' | undefined}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  reposts={post.shares_count}
                  bookmarks={post.bookmarks_count ?? 0}
                  views={post.views_count ?? 0}
                  httnEarned={post.httn_earned}
                  createdAt={new Date(post.created_at)}
                  isLiked={post.is_liked}
                  isReposted={post.is_reposted}
                  isBookmarked={post.is_bookmarked}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No liked posts yet
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditing} onOpenChange={(open) => { if (!open) cancelEditing(); }}>
          <DialogContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden">
            <DialogHeader className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
                <DialogTitle className="font-display text-lg">Edit profile</DialogTitle>
                <Button variant="gold" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogHeader>

            <div className="max-h-[85vh] overflow-y-auto">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageSelect(event, 'cover')}
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageSelect(event, 'avatar')}
              />

              <div className="relative h-48 bg-gradient-to-r from-primary/30 via-primary/20 to-herald-violet/20">
                {displayedCover && (
                  <img
                    src={displayedCover}
                    alt="Profile header"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  {displayedCover && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-background/90"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setRemoveCover(true);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="px-5 pb-6">
                <div className="-mt-12 mb-6 flex items-end justify-between gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-secondary">
                    {displayedAvatar ? (
                      <img src={displayedAvatar} alt={profile?.display_name || 'Profile'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-display font-bold text-foreground">
                        {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  {displayedAvatar && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setRemoveAvatar(true);
                      }}
                    >
                      Remove photo
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Name"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Bio</Label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Describe yourself"
                      maxLength={160}
                      className="min-h-[110px]"
                    />
                    <p className="text-right text-xs text-muted-foreground">{editForm.bio.length}/160</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website"
                      inputMode="url"
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
