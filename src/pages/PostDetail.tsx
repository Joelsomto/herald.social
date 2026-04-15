import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BarChart2,
  Bookmark,
  Heart,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Share2,
} from 'lucide-react';
import { MainLayout } from '@/components/herald/MainLayout';
import { CommentsSection } from '@/components/herald/CommentsSection';
import { RightSidebarWithAds } from '@/components/herald/RightSidebarWithAds';
import { LiveSection } from '@/components/herald/LiveSection';
import { NewsSection } from '@/components/herald/NewsSection';
import { TrendingSection } from '@/components/herald/TrendingSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { bookmarkPost, getPost, likePost, sharePost, unlikePost, unbookmarkPost } from '@/lib/api/posts';
import { ApiError } from '@/lib/apiClient';

const INTERACTION_SYNC_INTERVAL_MS = 5_000;

interface Profile {
  id?: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
  is_creator?: boolean;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_urls?: string[];
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  views_count?: number;
  httn_earned: number;
  created_at: string;
  author: Profile;
  author_id: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  repost_context?: string | null;
}

function mapPost(raw: any): Post {
  const username = raw.username || raw.author?.username || (typeof raw.author_id === 'object' ? raw.author_id.username : null) || 'unknown';
  const displayName = raw.display_name || raw.author?.display_name || (typeof raw.author_id === 'object' ? raw.author_id.display_name : null) || 'Unknown';
  const avatarUrl = raw.avatar_url || raw.author?.avatar_url || (typeof raw.author_id === 'object' ? raw.author_id.avatar_url : null);
  const isVerified = raw.is_verified || raw.author?.is_verified || (typeof raw.author_id === 'object' ? raw.author_id.is_verified : false);
  const isCreator = raw.is_creator || raw.author?.is_creator || (typeof raw.author_id === 'object' ? raw.author_id.is_creator : false);

  return {
    ...raw,
    author: {
      id: typeof raw.author_id === 'string' ? raw.author_id : raw.author_id?.id || raw.author?.id,
      username,
      display_name: displayName,
      avatar_url: avatarUrl,
      is_verified: isVerified,
      is_creator: isCreator,
    },
    author_id: typeof raw.author_id === 'string' ? raw.author_id : raw.author_id?.id || raw.author?.id || '',
    media_url: raw.media_url || null,
    media_urls: Array.isArray(raw.media_urls) ? raw.media_urls : raw.media_url ? [raw.media_url] : [],
    media_type: raw.media_type || null,
    bookmarks_count: raw.bookmarks_count ?? 0,
    views_count: raw.views_count ?? 0,
    repost_context: raw.repost_context ?? null,
    isLiked: raw.is_liked ?? false,
    isReposted: raw.is_reposted ?? false,
    isBookmarked: raw.is_bookmarked ?? false,
  };
}

function getErrorDescription(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const details = error.details;
    if (typeof details === 'string' && details.trim()) return details;
    if (details && typeof details === 'object') {
      const payload = details as Record<string, any>;
      if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
      if (payload.error && typeof payload.error === 'object' && typeof payload.error.message === 'string') {
        return payload.error.message;
      }
      if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    }
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAbsoluteMeta(createdAt: Date) {
  const time = createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const date = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${time} · ${date}`;
}

function normaliseMediaUrls(mediaUrls?: string[] | null, mediaUrl?: string | null) {
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    return mediaUrls.filter(Boolean);
  }
  return mediaUrl ? [mediaUrl] : [];
}

function isImageMedia(mediaUrl?: string | null, mediaType?: string | null) {
  if (!mediaUrl) return false;
  if (mediaType?.startsWith('image')) return true;
  if (mediaType?.startsWith('video')) return false;
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(mediaUrl);
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interacting, setInteracting] = useState<Set<string>>(new Set());

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getPost(postId);
      setPost(mapPost(response));
    } catch (err) {
      console.error('Error loading post detail:', err);
      setPost(null);
      setError('Unable to load this post right now.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (!postId) return;

    const syncPostInteractions = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const response = await getPost(postId);
        const latestPost = mapPost(response);
        setPost((prev) => prev ? {
          ...prev,
          likes_count: latestPost.likes_count,
          comments_count: latestPost.comments_count,
          shares_count: latestPost.shares_count,
          bookmarks_count: latestPost.bookmarks_count,
          views_count: latestPost.views_count,
          isLiked: latestPost.isLiked,
          isReposted: latestPost.isReposted,
          isBookmarked: latestPost.isBookmarked,
        } : prev);
      } catch (syncError) {
        console.error('Error refreshing post detail interactions:', syncError);
      }
    };

    void syncPostInteractions();

    const handleVisibilityOrFocus = () => {
      void syncPostInteractions();
    };

    const intervalId = window.setInterval(syncPostInteractions, INTERACTION_SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [postId]);

  const requireAuth = () => {
    if (user) return true;

    toast({
      title: 'Sign in required',
      description: 'Sign in to like, repost, bookmark, or reply to this post.',
    });
    navigate('/auth');
    return false;
  };

  const handleLike = async () => {
    if (!post || interacting.has(post.id) || !requireAuth()) return;

    const wasLiked = post.isLiked ?? false;
    const previousPost = { ...post };

    setInteracting((prev) => new Set(prev).add(post.id));
    setPost((prev) => prev ? {
      ...prev,
      isLiked: !wasLiked,
      likes_count: wasLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1,
    } : prev);

    try {
      const result = wasLiked ? await unlikePost(post.id) : await likePost(post.id);
      if (result?.likes_count !== undefined) {
        setPost((prev) => prev ? { ...prev, likes_count: result.likes_count } : prev);
      }
    } catch (err) {
      console.error('Error toggling like on post detail:', err);
      setPost(previousPost);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to update like. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const handleRepost = async () => {
    if (!post || interacting.has(post.id) || post.isReposted || !requireAuth()) return;

    const previousPost = { ...post };

    setInteracting((prev) => new Set(prev).add(post.id));
    setPost((prev) => prev ? { ...prev, isReposted: true, shares_count: prev.shares_count + 1 } : prev);

    try {
      const result = await sharePost(post.id);
      if (result?.shares_count !== undefined) {
        setPost((prev) => prev ? { ...prev, shares_count: result.shares_count } : prev);
      }
    } catch (err) {
      console.error('Error reposting on post detail:', err);
      setPost(previousPost);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to repost. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const handleBookmark = async () => {
    if (!post || interacting.has(post.id) || !requireAuth()) return;

    const wasBookmarked = post.isBookmarked ?? false;
    const previousPost = { ...post };

    setInteracting((prev) => new Set(prev).add(post.id));
    setPost((prev) => prev ? {
      ...prev,
      isBookmarked: !wasBookmarked,
      bookmarks_count: wasBookmarked ? Math.max(0, prev.bookmarks_count - 1) : prev.bookmarks_count + 1,
    } : prev);

    try {
      const result = wasBookmarked ? await unbookmarkPost(post.id) : await bookmarkPost(post.id);
      if (result?.bookmarks_count !== undefined) {
        setPost((prev) => prev ? { ...prev, bookmarks_count: result.bookmarks_count } : prev);
      }
    } catch (err) {
      console.error('Error bookmarking post detail:', err);
      setPost(previousPost);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to bookmark. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const snippet = post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content;
    const shareText = `${post.author.display_name}: ${snippet}`;

    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard.',
        });
      } catch (err) {
        console.error('Error copying post link:', err);
        toast({
          title: 'Error',
          description: 'Unable to copy the post link.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      await navigator.share({
        title: `Post by ${post.author.display_name}`,
        text: shareText,
        url: shareUrl,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error invoking native share:', err);
        toast({
          title: 'Error',
          description: 'Unable to share this post right now.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCommentAdded = (countDelta = 1) => {
    setPost((prev) => prev ? { ...prev, comments_count: prev.comments_count + countDelta } : prev);
  };

  const rightSidebar = (
    <RightSidebarWithAds>
      <LiveSection compact />
      <NewsSection compact />
      <TrendingSection />
    </RightSidebarWithAds>
  );

  const mediaUrls = useMemo(() => normaliseMediaUrls(post?.media_urls, post?.media_url), [post?.media_url, post?.media_urls]);
  const primaryMediaUrl = mediaUrls[0] ?? null;
  const multipleImages = isImageMedia(primaryMediaUrl, post?.media_type ?? null) && mediaUrls.length > 1;
  const createdAt = post ? new Date(post.created_at) : null;

  if (loading) {
    return (
      <MainLayout rightSidebar={rightSidebar} hideMobileNav={!user}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (error || !post || !createdAt) {
    return (
      <MainLayout rightSidebar={rightSidebar} hideMobileNav={!user}>
        <div className="p-8 text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {error || 'This post could not be found.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={fetchPost} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Link to={user ? '/feed' : '/'}>
              <Button variant="ghost">Go back</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout rightSidebar={rightSidebar} hideMobileNav={!user}>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">Post</h1>
        </div>
      </header>

      {!user && (
        <div className="border-b border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          You can read this post now. Sign in to reply, repost, like, or bookmark.
        </div>
      )}

      <article className="border-b border-border px-4 py-4">
        {post.repost_context && (
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Repeat2 className="h-3 w-3" />
            <span>{post.repost_context}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Link to={`/user/${post.author.username}`} className="flex-shrink-0">
            <img
              src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.display_name || post.author.username || 'User')}&background=E0E7FF&color=3730A3&bold=true`}
              alt={post.author.display_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <Link to={`/user/${post.author.username}`} className="font-semibold text-foreground hover:underline">
                {post.author.display_name}
              </Link>
              {post.author.is_verified && (
                <BadgeCheck className={`h-4 w-4 ${post.author.is_creator ? 'text-primary fill-primary/20' : 'text-blue-400'}`} />
              )}
              <Link to={`/user/${post.author.username}`} className="text-muted-foreground hover:underline">
                @{post.author.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatRelativeTime(createdAt)}</span>
            </div>

            <div className="mt-3 whitespace-pre-wrap text-[22px] leading-8 text-foreground">
              {post.content}
            </div>

            {multipleImages && (
              <div className="mt-4 grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-border">
                {mediaUrls.slice(0, 4).map((uri, index) => (
                  <img
                    key={`${post.id}-detail-media-${index}-${uri}`}
                    src={uri}
                    alt=""
                    className="h-56 w-full object-cover"
                  />
                ))}
              </div>
            )}

            {!multipleImages && primaryMediaUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                {post.media_type === 'video' ? (
                  <video src={primaryMediaUrl} controls className="max-h-[520px] w-full object-cover" />
                ) : (
                  <img src={primaryMediaUrl} alt="" className="max-h-[520px] w-full object-cover" />
                )}
              </div>
            )}

            <div className="mt-4 border-b border-border pb-3 text-sm text-muted-foreground">
              <span>{formatAbsoluteMeta(createdAt)}</span>
              <span className="px-2">·</span>
              <span>{formatCount(post.views_count ?? 0)} Views</span>
            </div>

            <div className="flex flex-wrap gap-4 border-b border-border py-3 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{formatCount(post.comments_count)}</span> Replies</span>
              <span><span className="font-semibold text-foreground">{formatCount(post.shares_count)}</span> Reposts</span>
              <span><span className="font-semibold text-foreground">{formatCount(post.likes_count)}</span> Likes</span>
              <span><span className="font-semibold text-foreground">{formatCount(post.bookmarks_count)}</span> Bookmarks</span>
            </div>

            <div className="flex max-w-md items-center justify-between border-b border-border py-1">
              <button onClick={() => document.getElementById('reply-composer')?.focus()} className="rounded-full p-3 text-muted-foreground transition-colors hover:bg-blue-400/10 hover:text-blue-400">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button onClick={handleRepost} className={`rounded-full p-3 transition-colors hover:bg-green-400/10 ${post.isReposted ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'}`}>
                <Repeat2 className="h-5 w-5" />
              </button>
              <button onClick={handleLike} className={`rounded-full p-3 transition-colors hover:bg-rose-500/10 ${post.isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}>
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleBookmark} className={`rounded-full p-3 transition-colors hover:bg-primary/10 ${post.isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                <Bookmark className={`h-5 w-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleShare} className="rounded-full p-3 text-muted-foreground transition-colors hover:bg-blue-400/10 hover:text-blue-400">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <section className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart2 className="h-4 w-4" />
          <span>Conversation</span>
        </div>
      </section>

      <CommentsSection postId={post.id} onCommentAdded={handleCommentAdded} />
    </MainLayout>
  );
}
