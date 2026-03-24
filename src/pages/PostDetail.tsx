import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import type { ShareTarget } from '@/components/herald/TwitterStylePost';
import { RightSidebarWithAds } from '@/components/herald/RightSidebarWithAds';
import { LiveSection } from '@/components/herald/LiveSection';
import { NewsSection } from '@/components/herald/NewsSection';
import { TrendingSection } from '@/components/herald/TrendingSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { likePost, unlikePost, sharePost, bookmarkPost, unbookmarkPost, getPost } from '@/lib/api/posts';
import { ApiError } from '@/lib/apiClient';

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
    media_type: raw.media_type || null,
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

  const requireAuth = () => {
    if (user) return true;

    toast({
      title: 'Sign in required',
      description: 'Sign in to like, repost, bookmark, or reply to this post.',
    });
    navigate('/auth');
    return false;
  };

  const handleLike = async (id: string) => {
    if (!post || id !== post.id || interacting.has(id) || !requireAuth()) return;

    const wasLiked = post.isLiked ?? false;
    const previousLikes = post.likes_count;

    setInteracting(prev => new Set(prev).add(id));
    setPost(prev => prev ? {
      ...prev,
      isLiked: !wasLiked,
      likes_count: wasLiked ? prev.likes_count - 1 : prev.likes_count + 1,
    } : prev);

    try {
      wasLiked ? await unlikePost(id) : await likePost(id);
    } catch (err) {
      console.error('Error toggling like on post detail:', err);
      setPost(prev => prev ? { ...prev, isLiked: wasLiked, likes_count: previousLikes } : prev);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to update like. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRepost = async (id: string) => {
    if (!post || id !== post.id || interacting.has(id) || post.isReposted || !requireAuth()) return;

    const previousShares = post.shares_count;

    setInteracting(prev => new Set(prev).add(id));
    setPost(prev => prev ? { ...prev, isReposted: true, shares_count: prev.shares_count + 1 } : prev);

    try {
      await sharePost(id);
    } catch (err) {
      console.error('Error reposting on post detail:', err);
      setPost(prev => prev ? { ...prev, isReposted: false, shares_count: previousShares } : prev);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to repost. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBookmark = async (id: string) => {
    if (!post || id !== post.id || interacting.has(id) || !requireAuth()) return;

    const wasBookmarked = post.isBookmarked ?? false;

    setInteracting(prev => new Set(prev).add(id));
    setPost(prev => prev ? { ...prev, isBookmarked: !wasBookmarked } : prev);

    try {
      if (wasBookmarked) {
        await unbookmarkPost(id);
        toast({ title: 'Removed', description: 'Post removed from bookmarks.' });
      } else {
        await bookmarkPost(id);
        toast({ title: 'Saved', description: 'Post added to your bookmarks.' });
      }
    } catch (err) {
      console.error('Error bookmarking post detail:', err);
      setPost(prev => prev ? { ...prev, isBookmarked: wasBookmarked } : prev);
      toast({
        title: 'Error',
        description: getErrorDescription(err, 'Failed to bookmark. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setInteracting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleShare = async (id: string, target: ShareTarget = 'native') => {
    if (!post || id !== post.id) return;

    const shareUrl = `${window.location.origin}/post/${id}`;
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

    if (target !== 'native') {
      window.open(socialUrls[target], '_blank', 'noopener,noreferrer');
      return;
    }

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

  const handleCommentAdded = (id: string, countDelta = 1) => {
    if (!post || id !== post.id) return;
    setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + countDelta } : prev);
  };

  const rightSidebar = (
    <RightSidebarWithAds>
      <LiveSection compact />
      <NewsSection compact />
      <TrendingSection />
    </RightSidebarWithAds>
  );

  if (loading) {
    return (
      <MainLayout rightSidebar={rightSidebar} hideMobileNav={!user}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
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
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Post</h1>
            <p className="text-xs text-muted-foreground">Shared link preview</p>
          </div>
        </div>
      </header>

      {!user && (
        <div className="border-b border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          You can view this post now. Sign in to like, repost, bookmark, or reply.
        </div>
      )}

      <TwitterStylePost
        id={post.id}
        author={{
          id: post.author.id || post.author_id,
          displayName: post.author.display_name,
          username: post.author.username,
          avatar: post.author.avatar_url,
          isVerified: post.author.is_verified,
          isGoldVerified: post.author.is_verified && post.author.is_creator,
        }}
        content={post.content}
        mediaUrl={post.media_url || undefined}
        mediaType={post.media_type === 'video' ? 'video' : 'image'}
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
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCommentAdded={handleCommentAdded}
      />
    </MainLayout>
  );
}
