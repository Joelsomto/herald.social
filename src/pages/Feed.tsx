import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import type { ShareTarget } from '@/components/herald/TwitterStylePost';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { TasksPanel } from '@/components/herald/TasksPanel';
import { CreatePostDialog } from '@/components/herald/CreatePostDialog';
import { SchedulePostDialog } from '@/components/herald/SchedulePostDialog';
import { FloatingMessageButton } from '@/components/herald/FloatingMessageButton';
import { TrendingSection } from '@/components/herald/TrendingSection';
import { RightSidebarWithAds } from '@/components/herald/RightSidebarWithAds';
import { SearchBar } from '@/components/herald/SearchBar';
import { LiveSection } from '@/components/herald/LiveSection';
import { NewsSection } from '@/components/herald/NewsSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Image, Smile, Calendar, MapPin, Loader2, RefreshCw, TrendingUp, Clock, Users, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser, getTopUsers } from '@/lib/api/users';
import { getCurrentUserWallet } from '@/lib/api/wallets';
import { getPosts, getTrendingPosts, getFollowingPosts, deletePost as apiDeletePost, likePost as apiLikePost, unlikePost as apiUnlikePost, sharePost as apiSharePost, bookmarkPost as apiBookmarkPost, unbookmarkPost as apiUnbookmarkPost, createPost } from '@/lib/api/posts';
import { getUserTasks, claimTaskReward } from '@/lib/api/tasks';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

type FeedFilter = 'recent' | 'trending' | 'following';

const FEED_POSTS_CACHE_TTL_MS = 30_000;
const FEED_USER_DATA_CACHE_TTL_MS = 120_000;
const FEED_TOP_CREATORS_CACHE_TTL_MS = 300_000;

const feedPostsCache = new Map<string, { posts: Post[]; hasMore: boolean; fetchedAt: number }>();
const feedUserDataCache = new Map<string, { wallet: WalletBalance | null; profile: Profile | null; tasks: UserTask[]; fetchedAt: number }>();
let topCreatorsCache: { data: Profile[]; fetchedAt: number } | null = null;

const getFeedCacheKey = (userId: string | undefined, filter: FeedFilter) => `${userId ?? 'anonymous'}:${filter}`;

export default function Feed() {
  const { user } = useAuth();
  const { createNotification } = useRealTimeNotifications();
  const { toast } = useToast();
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('recent');
  const [interactingPosts, setInteractingPosts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filterMountedRef = useRef(false);

  const mapPost = useCallback((p: any): Post => {
    const username = p.username || p.author?.username || (typeof p.author_id === 'object' ? p.author_id.username : null) || 'unknown';
    const display_name = p.display_name || p.author?.display_name || (typeof p.author_id === 'object' ? p.author_id.display_name : null) || 'Unknown';
    const avatar_url = p.avatar_url || p.author?.avatar_url || (typeof p.author_id === 'object' ? p.author_id.avatar_url : null);
    const is_verified = p.is_verified || p.author?.is_verified || (typeof p.author_id === 'object' ? p.author_id.is_verified : false);
    const is_creator = p.is_creator || p.author?.is_creator || (typeof p.author_id === 'object' ? p.author_id.is_creator : false);

    return {
      ...p,
      author: {
        id: typeof p.author_id === 'string' ? p.author_id : p.author_id?.id || p.author?.id,
        username,
        display_name,
        avatar_url,
        is_verified,
        is_creator,
      },
      media_url: p.media_url || null,
      isLiked: p.is_liked ?? false,
      isReposted: p.is_reposted ?? false,
      isBookmarked: p.is_bookmarked ?? false,
    };
  }, []);

  const updateFeedCache = useCallback((nextPosts: Post[], nextHasMore: boolean, filter: FeedFilter = feedFilter) => {
    if (!user) return;
    feedPostsCache.set(getFeedCacheKey(user.id, filter), {
      posts: nextPosts,
      hasMore: nextHasMore,
      fetchedAt: Date.now(),
    });
  }, [feedFilter, user]);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserData(true),
        fetchPosts(feedFilter, true),
        fetchTopCreators(true),
      ]).catch(err => {
        console.error('Feed.tsx: Error loading feed data:', err);
      });
    }
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

  // Re-fetch when feed filter tab changes (skip on initial mount)
  useEffect(() => {
    if (!filterMountedRef.current) {
      filterMountedRef.current = true;
      return;
    }
    if (user) {
      fetchPosts(feedFilter, true);
    }
  }, [feedFilter]);

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore || posts.length === 0) return;

    // Trending is a single fixed-size list — no pagination
    if (feedFilter === 'trending') {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);

    try {
      // Calculate next page based on current posts
      const currentPage = Math.floor(posts.length / 20) + 1;
      let newPosts: any[] = [];

      if (feedFilter === 'following') {
        const response = await getFollowingPosts({ page: currentPage + 1, limit: 10 });
        newPosts = response.data;
      } else {
        const response = await getPosts({ page: currentPage + 1, limit: 10, sort: '-created_at' });
        if (Array.isArray(response)) {
          newPosts = response;
        } else if (response && 'data' in response && Array.isArray(response.data)) {
          newPosts = response.data;
        }
      }

      const nextHasMore = newPosts.length >= 10;
      setHasMore(nextHasMore);
      setPosts(prev => {
        const nextPosts = [...prev, ...newPosts.map(mapPost)];
        updateFeedCache(nextPosts, nextHasMore);
        return nextPosts;
      });
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    }
    
    setIsLoadingMore(false);
  };

  const loadNewPosts = async () => {
    await fetchPosts(feedFilter, false);
    setNewPostsAvailable(0);
  };

  const fetchUserData = async (preferCache = true) => {
    if (!user) return;

    const cached = feedUserDataCache.get(user.id);
    if (preferCache && cached && Date.now() - cached.fetchedAt < FEED_USER_DATA_CACHE_TTL_MS) {
      setWallet(cached.wallet);
      setProfile(cached.profile);
      setTasks(cached.tasks);
      return;
    }

    try {
      const results = await Promise.allSettled([
        getCurrentUserWallet(),
        getCurrentUser(),
        getUserTasks({ completed: false }),
      ]);

      const nextWallet = results[0].status === 'fulfilled' ? results[0].value : null;
      const nextProfile = results[1].status === 'fulfilled' ? results[1].value as any : null;
      const nextTasks = results[2].status === 'fulfilled' ? results[2].value as any : [];

      setWallet(nextWallet);
      setProfile(nextProfile);
      setTasks(nextTasks);
      feedUserDataCache.set(user.id, {
        wallet: nextWallet,
        profile: nextProfile,
        tasks: nextTasks,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      console.error('fetchUserData error:', error instanceof Error ? error.message : error);
    }
  };

  const fetchPosts = async (filter: FeedFilter = feedFilter, preferCache = true) => {
    if (!user) return;

    const cacheKey = getFeedCacheKey(user.id, filter);
    const cached = feedPostsCache.get(cacheKey);
    if (preferCache && cached && Date.now() - cached.fetchedAt < FEED_POSTS_CACHE_TTL_MS) {
      setPosts(cached.posts);
      setHasMore(cached.hasMore);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let postsArray: any[] = [];

      let nextHasMore = false;

      if (filter === 'trending') {
        const response = await getTrendingPosts(20);
        postsArray = response.data;
        nextHasMore = false;
      } else if (filter === 'following') {
        const response = await getFollowingPosts({ page: 1, limit: 20 });
        postsArray = response.data;
        nextHasMore = postsArray.length >= 20;
      } else {
        const response = await getPosts({ page: 1, limit: 20, sort: '-created_at' });
        if (Array.isArray(response)) {
          postsArray = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          postsArray = response.data;
        }
        nextHasMore = postsArray.length >= 20;
      }
      const mappedPosts = postsArray.map(mapPost);
      setPosts(mappedPosts);
      setHasMore(nextHasMore);
      updateFeedCache(mappedPosts, nextHasMore, filter);
    } catch (error) {
      console.error('fetchPosts error:', error instanceof Error ? error.message : error);
      setPosts([]);
      setError('Unable to load feed right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopCreators = async (preferCache = true) => {
    if (preferCache && topCreatorsCache && Date.now() - topCreatorsCache.fetchedAt < FEED_TOP_CREATORS_CACHE_TTL_MS) {
      setTopCreators(topCreatorsCache.data);
      return;
    }

    try {
      const data = await getTopUsers({ limit: 5, sort: '-reputation' });
      const nextCreators = (data ?? []) as any;
      setTopCreators(nextCreators);
      topCreatorsCache = { data: nextCreators, fetchedAt: Date.now() };
    } catch (error) {
      console.error('fetchTopCreators error:', error instanceof Error ? error.message : error);
      setTopCreators([]);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user || interactingPosts.has(postId)) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked || false;
    const newLikeCount = wasLiked ? post.likes_count - 1 : post.likes_count + 1;

    // Optimistic update
    setInteractingPosts(prev => new Set(prev).add(postId));
    setPosts(prevPosts => {
      const nextPosts = prevPosts.map(p => 
        p.id === postId 
          ? { ...p, isLiked: !wasLiked, likes_count: newLikeCount }
          : p
      );
      updateFeedCache(nextPosts, hasMore);
      return nextPosts;
    });

    try {
      if (wasLiked) {
        // Unlike
        await apiUnlikePost(postId);
      } else {
        // Like
        await apiLikePost(postId);

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
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => {
        const nextPosts = prevPosts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: wasLiked, likes_count: post.likes_count }
            : p
        );
        updateFeedCache(nextPosts, hasMore);
        return nextPosts;
      });
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInteractingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleRepost = async (postId: string) => {
    if (!user || interactingPosts.has(postId)) return;

    const post = posts.find(p => p.id === postId);
    if (!post || post.isReposted) return;

    // Optimistic update
    setInteractingPosts(prev => new Set(prev).add(postId));
    setPosts(prevPosts => {
      const nextPosts = prevPosts.map(p => 
        p.id === postId 
          ? { ...p, isReposted: true, shares_count: p.shares_count + 1 }
          : p
      );
      updateFeedCache(nextPosts, hasMore);
      return nextPosts;
    });

    try {
      await apiSharePost(postId);

      if (post.author_id !== user.id) {
        createNotification(
          post.author_id,
          'share',
          'Repost!',
          'reposted your content',
          postId,
          'post'
        );
      }

      toast({
        title: 'Reposted',
        description: 'This post is now shared to your network.',
      });
    } catch (error) {
      console.error('Error toggling repost:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => {
        const nextPosts = prevPosts.map(p => 
          p.id === postId 
            ? { ...p, isReposted: false, shares_count: post.shares_count }
            : p
        );
        updateFeedCache(nextPosts, hasMore);
        return nextPosts;
      });
      toast({
        title: 'Error',
        description: 'Failed to repost. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInteractingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user || interactingPosts.has(postId)) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasBookmarked = post.isBookmarked || false;

    // Optimistic update
    setInteractingPosts(prev => new Set(prev).add(postId));
    setPosts(prevPosts => {
      const nextPosts = prevPosts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: !wasBookmarked }
          : p
      );
      updateFeedCache(nextPosts, hasMore);
      return nextPosts;
    });

    try {
      if (wasBookmarked) {
        await apiUnbookmarkPost(postId);
        toast({ title: 'Removed', description: 'Post removed from bookmarks' });
      } else {
        await apiBookmarkPost(postId);
        toast({ title: 'Saved', description: 'Post added to your bookmarks' });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update
      setPosts(prevPosts => {
        const nextPosts = prevPosts.map(p => 
          p.id === postId 
            ? { ...p, isBookmarked: wasBookmarked }
            : p
        );
        updateFeedCache(nextPosts, hasMore);
        return nextPosts;
      });
      toast({
        title: 'Error',
        description: 'Failed to bookmark. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInteractingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleShare = async (postId: string, target: ShareTarget = 'native') => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const shareUrl = `${window.location.origin}/post/${postId}`;
    const snippet = post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content;
    const shareText = `${post.author.display_name}: ${snippet}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const socialUrls: Record<Exclude<ShareTarget, 'copy' | 'native'>, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };

    if (target === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard.',
        });
      } catch (error) {
        console.error('Error copying share link:', error);
        toast({
          title: 'Error',
          description: 'Unable to copy the post link.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (target !== 'native') {
      window.open(socialUrls[target], '_blank', 'noopener,noreferrer');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.display_name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: 'Error',
            description: 'Unable to share this post right now.',
            variant: 'destructive',
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard.',
        });
      } catch (error) {
        console.error('Error copying share link:', error);
        toast({
          title: 'Error',
          description: 'Unable to copy the post link.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCommentAdded = useCallback((postId: string, countDelta = 1) => {
    setPosts(prevPosts => {
      const nextPosts = prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments_count: post.comments_count + countDelta }
          : post
      );
      updateFeedCache(nextPosts, hasMore);
      return nextPosts;
    });
  }, [hasMore, updateFeedCache]);

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post || post.author_id !== user.id) return;

    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiDeletePost(postId);

      // Optimistic update
      setPosts(prevPosts => {
        const nextPosts = prevPosts.filter(p => p.id !== postId);
        updateFeedCache(nextPosts, hasMore);
        return nextPosts;
      });
      
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await claimTaskReward(taskId);
      fetchUserData(false);
    } catch (error) {
      console.error('Error claiming task reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleQuickPost = async () => {
    if (!user || !postContent.trim() || isPosting) return;
    
    setIsPosting(true);
    try {
      await createPost({
        content: postContent.trim(),
      });

      toast({
        title: 'Post created!',
        description: 'Your post has been shared. +25 HTTN Points earned!',
      });

      setPostContent('');
      
      // Refresh feed and user data
      if (user) {
        const cachePrefix = `${user.id}:`;
        for (const key of Array.from(feedPostsCache.keys())) {
          if (key.startsWith(cachePrefix)) {
            feedPostsCache.delete(key);
          }
        }
      }
      await Promise.all([fetchPosts(feedFilter, false), fetchUserData(false)]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
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
    await Promise.all([fetchPosts(feedFilter, false), fetchUserData(false), fetchTopCreators(false)]);
  };

  const rightSidebar = (
    <RightSidebarWithAds>
      <WalletPreview balance={walletBalance} />
      <LiveSection compact />
      <NewsSection compact />
      <TrendingSection />
      <TasksPanel tasks={formattedTasks} onClaim={handleClaimTask} />
    </RightSidebarWithAds>
  );


  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header with Search and Filters */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-foreground">Home</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchPosts(feedFilter, false)}
              disabled={isLoading}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Feed Filter Tabs */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => setFeedFilter('recent')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                feedFilter === 'recent'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </div>
            </button>
            <button
              onClick={() => setFeedFilter('trending')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                feedFilter === 'trending'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </div>
            </button>
            <button
              onClick={() => setFeedFilter('following')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                feedFilter === 'following'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Following</span>
              </div>
            </button>
          </div>
          
          <SearchBar />
        </div>
      </header>

      {/* Compose Box */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          {/* Avatar with UIAvatar fallback */}
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || profile?.username || 'User')}&background=E0E7FF&color=3730A3&bold=true`}
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <Textarea
              placeholder="What's happening?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] border-none bg-transparent resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full" onClick={() => setCreateDialogOpen(true)}>
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

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPosts(feedFilter, false)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* New posts notification */}
      {newPostsAvailable > 0 && (
        <button
          onClick={loadNewPosts}
          className="w-full py-3 bg-primary/10 text-primary text-sm font-medium border-b border-border hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 animate-pulse"
        >
          <RefreshCw className="w-4 h-4" />
          Show {newPostsAvailable} new post{newPostsAvailable > 1 ? 's' : ''}
        </button>
      )}

      {/* Feed */}
      <div>
        {/* Posts from database */}
        {isLoading && posts.length === 0 ? (
          // Loading skeleton for perceived speed
          <div className="space-y-4 p-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id}>
              <TwitterStylePost
                id={post.id}
                author={{
                  id: post.author_id,
                  displayName: post.author?.display_name || 'Unknown',
                  username: post.author?.username || 'unknown',
                  avatar:
                    post.author?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.display_name || post.author?.username || 'User')}&background=E0E7FF&color=3730A3&bold=true`,
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
                isLiked={post.isLiked}
                isReposted={post.isReposted}
                isBookmarked={post.isBookmarked}
                onLike={handleLike}
                onRepost={handleRepost}
                onCommentAdded={handleCommentAdded}
                onBookmark={handleBookmark}
                onShare={handleShare}
              />
              {/* Post actions menu for own posts */}
              {user && post.author_id === user.id && (
                <div className="px-4 pb-2 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))
        )}

        {/* No posts message */}
        {posts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-b border-border">
            <p>No posts available. Check back later!</p>
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

