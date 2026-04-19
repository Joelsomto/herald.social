import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import { Button } from '@/components/ui/button';
import { Loader2, Bookmark, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  clearAllBookmarks as apiClearAllBookmarks,
  getBookmarkedPosts,
  bookmarkPost as apiBookmarkPost,
  unbookmarkPost as apiUnbookmarkPost,
  likePost as apiLikePost,
  unlikePost as apiUnlikePost,
  sharePost as apiSharePost,
} from '@/lib/api/posts';

const INTERACTION_SYNC_INTERVAL_MS = 5_000;

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  httn_earned: number;
  created_at: string;
  author_id: string;
  author: {
    id?: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    is_verified?: boolean;
    is_creator?: boolean;
  };
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

function mapPost(p: any): Post {
  const username = p.username || p.author?.username || (typeof p.author_id === 'object' ? p.author_id?.username : null) || 'unknown';
  const display_name = p.display_name || p.author?.display_name || (typeof p.author_id === 'object' ? p.author_id?.display_name : null) || 'Unknown';
  const avatar_url = p.avatar_url || p.author?.avatar_url || (typeof p.author_id === 'object' ? p.author_id?.avatar_url : null);
  const is_verified = p.is_verified || p.author?.is_verified || false;
  const is_creator = p.is_creator || p.author?.is_creator || false;

  return {
    ...p,
    author: { username, display_name, avatar_url, is_verified, is_creator },
    media_url: p.media_url || null,
    bookmarks_count: p.bookmarks_count ?? 0,
    isLiked: p.is_liked ?? false,
    isReposted: p.is_reposted ?? false,
    isBookmarked: true, // all posts on this page are bookmarked
  };
}

export default function Bookmarks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [interacting, setInteracting] = useState<Set<string>>(new Set());

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await getBookmarkedPosts({ limit: 50 });
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setPosts(list.map(mapPost));
    } catch {
      toast({ title: 'Error', description: 'Failed to load bookmarks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const syncBookmarks = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchBookmarks();
    };

    const intervalId = window.setInterval(syncBookmarks, INTERACTION_SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', syncBookmarks);
    window.addEventListener('focus', syncBookmarks);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', syncBookmarks);
      window.removeEventListener('focus', syncBookmarks);
    };
  }, [user]);

  const handleLike = async (postId: string) => {
    if (interacting.has(postId)) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasLiked = post.isLiked ?? false;

    setInteracting(prev => new Set(prev).add(postId));
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, isLiked: !wasLiked, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 }
      : p));

    try {
      wasLiked ? await apiUnlikePost(postId) : await apiLikePost(postId);
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: wasLiked, likes_count: post.likes_count } : p));
    } finally {
      setInteracting(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  };

  const handleRepost = async (postId: string) => {
    if (interacting.has(postId)) return;
    const post = posts.find(p => p.id === postId);
    if (!post || post.isReposted) return; // reposts are one-way

    setInteracting(prev => new Set(prev).add(postId));
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, isReposted: true, shares_count: p.shares_count + 1 }
      : p));

    try {
      await apiSharePost(postId);
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReposted: false, shares_count: post.shares_count } : p));
    } finally {
      setInteracting(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  };

  const handleBookmark = async (postId: string) => {
    if (interacting.has(postId)) return;

    setInteracting(prev => new Set(prev).add(postId));
    // Remove from list optimistically
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await apiUnbookmarkPost(postId);
      toast({ title: 'Removed', description: 'Post removed from bookmarks' });
    } catch {
      // Re-fetch on failure
      fetchBookmarks();
    } finally {
      setInteracting(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  };

  const handleClearAll = async () => {
    if (clearing || posts.length === 0) return;
    setClearing(true);
    try {
      await apiClearAllBookmarks();
      setPosts([]);
      toast({ title: 'Cleared', description: 'All bookmarked posts were removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to clear bookmarks', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl text-foreground">Bookmarks</h1>
          </div>
          <p className="text-xs text-muted-foreground">Only you can see the posts you save here.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleClearAll} disabled={loading || clearing || posts.length === 0} className="rounded-full">
            <Trash2 className={`w-4 h-4 ${clearing ? 'animate-pulse' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchBookmarks} disabled={loading} className="rounded-full">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Bookmark className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">No bookmarks yet</p>
          <p className="text-sm">Save posts by tapping the bookmark icon</p>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <TwitterStylePost
              key={post.id}
              id={post.id}
              author={{
                id: post.author_id,
                displayName: post.author.display_name,
                username: post.author.username,
                avatar: post.author.avatar_url || null,
                isVerified: post.author.is_verified,
                isGoldVerified: post.author.is_verified && post.author.is_creator,
              }}
              content={post.content}
              mediaUrl={post.media_url || undefined}
              mediaType={post.media_type as 'image' | 'video' | undefined}
              likes={post.likes_count}
              comments={post.comments_count}
              reposts={post.shares_count}
              bookmarks={post.bookmarks_count}
              views={post.views_count ?? 0}
              httnEarned={post.httn_earned}
              createdAt={new Date(post.created_at)}
              isLiked={post.isLiked}
              isReposted={post.isReposted}
              isBookmarked={post.isBookmarked}
              onLike={handleLike}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
            />
          ))}
          <p className="text-center text-sm text-muted-foreground py-8">
            {posts.length} saved post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </MainLayout>
  );
}
