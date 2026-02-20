import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import { FollowButton } from '@/components/herald/FollowButton';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BadgeCheck, 
  MapPin, 
  Calendar, 
  Link as LinkIcon,
  ArrowLeft,
  Sparkles,
  Store
} from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
  is_verified: boolean | null;
  is_creator: boolean | null;
  tier: string | null;
  reputation: number | null;
  created_at: string;
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
  created_at: string;
}

// Dummy verified creator profile
const dummyCreator: Profile = {
  id: 'dummy-creator-1',
  user_id: 'dummy-user-1',
  username: 'herald_official',
  display_name: 'Herald Official',
  bio: '✨ Official Herald account. Building the future of Web3 social. Earn while you engage! 🚀',
  avatar_url: null,
  followers_count: 125400,
  following_count: 142,
  is_verified: true,
  is_creator: true,
  tier: 'partner',
  reputation: 50000,
  created_at: '2024-01-01T00:00:00Z',
};

const dummyPosts: Post[] = [
  {
    id: 'dp1',
    content: '🎉 Big announcement! We just crossed 100K active creators on Herald. Thank you all for being part of this journey. More rewards coming soon! #HeraldCommunity',
    media_url: null,
    media_type: null,
    likes_count: 4520,
    comments_count: 892,
    shares_count: 1203,
    httn_earned: 2500,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'dp2',
    content: 'The future of social media is here. Where your attention creates value, not just for platforms, but for YOU. Welcome to Herald.',
    media_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    media_type: 'image',
    likes_count: 3200,
    comments_count: 456,
    shares_count: 890,
    httn_earned: 1800,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'dp3',
    content: 'Weekly creator spotlight! 🌟 Shoutout to @creativestudio for amazing content this week. Keep creating, keep earning!',
    media_url: null,
    media_type: null,
    likes_count: 2100,
    comments_count: 234,
    shares_count: 445,
    httn_earned: 950,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % verticalAds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    
    // Check for dummy creator profile
    if (username === 'herald_official') {
      setProfile(dummyCreator);
      setPosts(dummyPosts);
      setLoading(false);
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileData) {
      setProfile(profileData);
      
      // Fetch user posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profileData.user_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (postsData) setPosts(postsData);
    }
    
    setLoading(false);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const isGoldVerified = profile?.is_verified && (profile?.tier === 'partner' || profile?.tier === 'herald');

  const rightSidebar = (
    <>
      <VerticalAdBanner {...verticalAds[adIndex]} />
      
      {/* E-Store Link */}
      <div className="herald-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Herald E-Store</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Shop exclusive merch, NFT badges, and creator tools.
        </p>
        <Button variant="gold-outline" className="w-full gap-2">
          <Store className="w-4 h-4" />
          Visit Store
        </Button>
      </div>
    </>
  );

  if (loading) {
    return (
      <MainLayout rightSidebar={rightSidebar}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout rightSidebar={rightSidebar}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">User not found</h2>
          <p className="text-muted-foreground mt-2">The user @{username} doesn't exist.</p>
          <Link to="/feed">
            <Button variant="gold" className="mt-4">
              Go Home
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-4">
          <Link to="/feed">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-1">
              {profile.display_name || profile.username}
              {isGoldVerified && (
                <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
              )}
              {profile.is_verified && !isGoldVerified && (
                <BadgeCheck className="w-5 h-5 text-blue-400" />
              )}
            </h1>
            <p className="text-xs text-muted-foreground">{posts.length} posts</p>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary to-primary/10" />

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-border">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-28 h-28 rounded-full border-4 border-background bg-secondary flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || ''}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-display text-4xl font-bold text-foreground">
                {(profile.display_name || profile.username || '?')[0].toUpperCase()}
              </span>
            )}
          </div>
          {isGoldVerified && (
            <div className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center gold-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Name and Follow */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-1">
              {profile.display_name || profile.username}
              {isGoldVerified && (
                <BadgeCheck className="w-6 h-6 text-primary fill-primary/20" />
              )}
              {profile.is_verified && !isGoldVerified && (
                <BadgeCheck className="w-6 h-6 text-blue-400" />
              )}
            </h2>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          {user && profile.user_id !== user.id && (
            <FollowButton targetUserId={profile.user_id} size="default" />
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground mb-3">{profile.bio}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          {profile.tier && (
            <span className="flex items-center gap-1 capitalize">
              <Sparkles className="w-4 h-4 text-primary" />
              {profile.tier}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5">
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{formatNumber(profile.following_count)}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </button>
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{formatNumber(profile.followers_count)}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </button>
          {profile.reputation && (
            <span>
              <span className="font-semibold gold-text">{formatNumber(profile.reputation)}</span>
              <span className="text-muted-foreground ml-1">Rep</span>
            </span>
          )}
        </div>
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
          {posts.length > 0 ? (
            posts.map((post) => (
              <TwitterStylePost
                key={post.id}
                id={post.id}
                author={{
                  id: profile.user_id,
                  displayName: profile.display_name || profile.username || 'User',
                  username: profile.username || 'user',
                  avatar: profile.avatar_url,
                  isVerified: profile.is_verified || false,
                  isGoldVerified: isGoldVerified,
                }}
                content={post.content}
                mediaUrl={post.media_url || undefined}
                mediaType={post.media_type as 'image' | 'video' | undefined}
                likes={post.likes_count}
                comments={post.comments_count}
                reposts={post.shares_count}
                httnEarned={post.httn_earned}
                createdAt={new Date(post.created_at)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No posts yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            No replies yet
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <div className="grid grid-cols-3 gap-0.5">
            {posts.filter(p => p.media_url).map((post) => (
              <div key={post.id} className="aspect-square bg-secondary">
                <img 
                  src={post.media_url!} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {posts.filter(p => p.media_url).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No media yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            Likes are private
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
