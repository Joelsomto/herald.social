import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { TasksPanel } from '@/components/herald/TasksPanel';
import { CreatePostDialog } from '@/components/herald/CreatePostDialog';
import { SchedulePostDialog } from '@/components/herald/SchedulePostDialog';
import { FloatingMessageButton } from '@/components/herald/FloatingMessageButton';
import { TrendingSection } from '@/components/herald/TrendingSection';
import { RightSidebarWithAds } from '@/components/herald/RightSidebarWithAds';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { PullToRefresh } from '@/components/herald/PullToRefresh';
import { SearchBar } from '@/components/herald/SearchBar';
import { LiveSection } from '@/components/herald/LiveSection';
import { NewsSection } from '@/components/herald/NewsSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Image, Smile, Calendar, MapPin, BadgeCheck, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useIsMobile } from '@/hooks/use-mobile';

interface WalletBalance {
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
}

interface Profile {
  display_name: string;
  username: string;
  tier: string;
  reputation: number;
  avatar_url: string | null;
  is_creator: boolean;
  is_verified: boolean;
}

interface UserTask {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_type: string;
  progress: number;
  target: number;
  completed: boolean;
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
  author: Profile;
  author_id: string;
}

// Dummy verified creators for demo
const dummyVerifiedCreators = [
  { id: 'v1', displayName: 'Herald Official', username: 'herald', avatar: null, isGoldVerified: true },
  { id: 'v2', displayName: 'Sarah Chen', username: 'sarahcreates', avatar: null, isGoldVerified: true },
  { id: 'v3', displayName: 'Alex Rivera', username: 'alexr', avatar: null, isGoldVerified: true },
];

// Dummy posts for demo
const dummyPosts = [
  {
    id: 'd1',
    content: 'Just launched our community impact report! 🚀 This quarter we helped 500+ creators earn their first HTTN tokens. The future of creator economy is here.',
    author: { id: 'v1', displayName: 'Herald Official', username: 'herald', avatar: null, isGoldVerified: true, isVerified: true },
    likes: 1234,
    comments: 89,
    reposts: 234,
    httnEarned: 450,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 'd2',
    content: 'Every contribution matters. Every voice counts. Today I learned that my small daily actions have compounded into real impact. Thank you, Herald community. 💛',
    author: { id: 'v2', displayName: 'Sarah Chen', username: 'sarahcreates', avatar: null, isGoldVerified: true, isVerified: true },
    likes: 567,
    comments: 45,
    reposts: 123,
    httnEarned: 320,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'd3',
    content: 'Web3 isn\'t about speculation. It\'s about ownership. It\'s about creators finally getting what they deserve. Herald gets it. 🙌',
    author: { id: 'v3', displayName: 'Alex Rivera', username: 'alexr', avatar: null, isGoldVerified: true, isVerified: true },
    likes: 892,
    comments: 67,
    reposts: 189,
    httnEarned: 560,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: 'd4',
    content: 'Completed my weekly tasks and got bonus tokens! Who else is grinding? 💪 #HTTNRewards',
    author: { id: 'u1', displayName: 'Jordan Taylor', username: 'jtaylor', avatar: null, isGoldVerified: false, isVerified: false },
    likes: 156,
    comments: 18,
    reposts: 12,
    httnEarned: 80,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

export default function Feed() {
  const { user } = useAuth();
  const { createNotification } = useRealTimeNotifications();
  const isMobile = useIsMobile();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [topCreators, setTopCreators] = useState<Profile[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchPosts();
      fetchTopCreators();
      subscribeToNewPosts();
    }
  }, [user]);

  const subscribeToNewPosts = useCallback(() => {
    const channel = supabase
      .channel('feed-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new;
          // If it's not the current user's post, show notification
          if (newPost.author_id !== user?.id) {
            setNewPostsAvailable(prev => prev + 1);
          } else {
            fetchPosts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Infinite scroll setup
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, posts]);

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore || posts.length === 0) return;
    
    setIsLoadingMore(true);
    const lastPost = posts[posts.length - 1];
    
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(display_name, username, tier, reputation, avatar_url, is_creator, is_verified)
      `)
      .lt('created_at', lastPost.created_at)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      if (data.length < 10) setHasMore(false);
      setPosts(prev => [...prev, ...data.map(p => ({ ...p, author: p.author as unknown as Profile }))]);
    }
    setIsLoadingMore(false);
  };

  const loadNewPosts = async () => {
    await fetchPosts();
    setNewPostsAvailable(0);
  };

  const fetchUserData = async () => {
    if (!user) return;

    const [walletRes, profileRes, tasksRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_tasks').select('*').eq('user_id', user.id).eq('completed', false),
    ]);

    if (walletRes.data) setWallet(walletRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(display_name, username, tier, reputation, avatar_url, is_creator, is_verified)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setPosts(data.map(p => ({ ...p, author: p.author as unknown as Profile })));
    }
  };

  const fetchTopCreators = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('reputation', { ascending: false })
      .limit(5);

    if (data) setTopCreators(data);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    await supabase.from('post_interactions').insert({
      post_id: postId,
      user_id: user.id,
      interaction_type: 'like',
    });

    const post = posts.find(p => p.id === postId);
    if (post) {
      await supabase.from('posts').update({ 
        likes_count: post.likes_count + 1 
      }).eq('id', postId);

      // Send notification to post author
      if (post.author_id !== user.id) {
        createNotification(
          post.author_id,
          'like',
          'New Like',
          'liked your post',
          postId,
          'post'
        );
      }
    }
    fetchPosts();
  };

  const handleRepost = async (postId: string) => {
    if (!user) return;

    await supabase.from('post_interactions').insert({
      post_id: postId,
      user_id: user.id,
      interaction_type: 'share',
    });

    const post = posts.find(p => p.id === postId);
    if (post && post.author_id !== user.id) {
      createNotification(
        post.author_id,
        'share',
        'Repost!',
        'reposted your content',
        postId,
        'post'
      );
    }
    fetchPosts();
  };

  const handleClaimTask = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await supabase.from('user_tasks').update({ completed: true }).eq('id', taskId);
    
    if (wallet) {
      await supabase.from('wallets').update({ 
        httn_points: wallet.httn_points + task.reward 
      }).eq('user_id', user.id);
    }

    fetchUserData();
  };

  const handleQuickPost = async () => {
    if (!user || !postContent.trim()) return;
    
    setIsPosting(true);
    await supabase.from('posts').insert({
      author_id: user.id,
      content: postContent.trim(),
    });

    if (wallet) {
      await supabase.from('wallets').update({
        httn_points: wallet.httn_points + 25,
      }).eq('user_id', user.id);
    }

    setPostContent('');
    setIsPosting(false);
    fetchPosts();
    fetchUserData();
  };

  const walletBalance = wallet ? {
    httnPoints: wallet.httn_points,
    httnTokens: Number(wallet.httn_tokens),
    espees: Number(wallet.espees),
    pendingRewards: wallet.pending_rewards,
  } : { httnPoints: 0, httnTokens: 0, espees: 0, pendingRewards: 0 };

  const formattedTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    reward: t.reward,
    type: t.task_type as 'daily' | 'weekly' | 'campaign',
    progress: t.progress,
    target: t.target,
    completed: t.completed,
  }));

  const handlePullRefresh = async () => {
    await fetchPosts();
    await fetchUserData();
  };

  const rightSidebar = (
    <RightSidebarWithAds>
      <WalletPreview balance={walletBalance} />
      <LiveSection compact />
      <NewsSection compact />
      <TrendingSection />
      <TasksPanel tasks={formattedTasks} onClaim={handleClaimTask} />
      
      {/* Who to follow */}
      <div className="herald-card p-4 space-y-3">
        <h3 className="font-display font-semibold text-foreground">Who to follow</h3>
        <div className="space-y-3">
          {dummyVerifiedCreators.map((creator) => (
            <div
              key={creator.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground">
                  {creator.displayName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {creator.displayName}
                    {creator.isGoldVerified && (
                      <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full font-semibold">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>
    </RightSidebarWithAds>
  );


  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header with Search */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-foreground">Home</h1>
          </div>
          <SearchBar />
        </div>
      </header>

      {/* Compose Box */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground flex-shrink-0">
            {profile?.display_name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="What's happening?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] border-none bg-transparent resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full">
                  <Image className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full" onClick={() => setScheduleDialogOpen(true)}>
                  <Calendar className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full">
                  <MapPin className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  +25 HTTN
                </span>
                <Button 
                  variant="gold" 
                  className="rounded-full font-semibold"
                  onClick={handleQuickPost}
                  disabled={!postContent.trim() || isPosting}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New posts notification */}
      {newPostsAvailable > 0 && (
        <button
          onClick={loadNewPosts}
          className="w-full py-3 bg-primary/10 text-primary text-sm font-medium border-b border-border hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Show {newPostsAvailable} new post{newPostsAvailable > 1 ? 's' : ''}
        </button>
      )}

      {/* Feed */}
      <div>
        {/* Show dummy posts first, then real posts */}
        {dummyPosts.map((post, index) => (
          <div key={post.id}>
            <TwitterStylePost
              id={post.id}
              author={post.author}
              content={post.content}
              likes={post.likes}
              comments={post.comments}
              reposts={post.reposts}
              httnEarned={post.httnEarned}
              createdAt={post.createdAt}
              onLike={handleLike}
              onRepost={handleRepost}
            />
            {/* Insert ads between posts */}
            {index === 1 && (
              <div className="px-4 py-3 border-b border-border">
                <VerticalAdBanner {...verticalAds[0]} />
              </div>
            )}
          </div>
        ))}

        {/* Real posts from database */}
        {posts.map((post, index) => (
          <div key={post.id}>
            <TwitterStylePost
              id={post.id}
              author={{
                id: post.author_id,
                displayName: post.author?.display_name || 'Unknown',
                username: post.author?.username || 'unknown',
                avatar: post.author?.avatar_url || null,
                isVerified: post.author?.is_verified || false,
                isGoldVerified: post.author?.is_verified && post.author?.is_creator,
              }}
              content={post.content}
              mediaUrl={post.media_url || undefined}
              mediaType={post.media_type as 'image' | 'video' | undefined}
              likes={post.likes_count}
              comments={post.comments_count}
              reposts={post.shares_count}
              httnEarned={post.httn_earned}
              createdAt={new Date(post.created_at)}
              onLike={handleLike}
              onRepost={handleRepost}
            />
            {/* Insert more ads periodically */}
            {index === 2 && (
              <div className="px-4 py-3 border-b border-border">
                <VerticalAdBanner {...verticalAds[1]} />
              </div>
            )}
          </div>
        ))}

        {posts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-b border-border">
            <p>No more posts. Check back later!</p>
          </div>
        )}
      </div>

      {/* Load more / Infinite scroll trigger */}
      <div ref={loadMoreRef} className="p-8 text-center">
        {isLoadingMore ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more posts...</span>
          </div>
        ) : hasMore ? (
          <Button variant="outline" className="rounded-full" onClick={loadMorePosts}>
            Load more posts
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You've reached the end!</p>
        )}
      </div>

      <CreatePostDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onPostCreated={fetchPosts}
      />

      <SchedulePostDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onPostScheduled={fetchPosts}
      />

      <FloatingMessageButton />
    </MainLayout>
  );
}
