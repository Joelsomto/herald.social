import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, BadgeCheck, Send } from 'lucide-react';
import { getPostComments, createComment, likeComment } from '@/lib/api/comments';
import { ApiError } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author_id: string;
  author?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    is_creator: boolean | null;
  } | null;
}

interface CommentsSectionProps {
  postId: string;
  isOpen?: boolean;
  onClose?: () => void;
  onCommentAdded?: (countDelta?: number) => void;
}

/** Small reusable avatar: shows image if url present, else first letter of name. */
function Avatar({ url, name, size = 8 }: { url?: string | null; name?: string | null; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  const initial = (name || '?')[0].toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name || ''}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground flex-shrink-0 text-sm`}>
      {initial}
    </div>
  );
}

export function CommentsSection({ postId, isOpen = true, onClose, onCommentAdded }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getErrorDescription = (error: unknown, fallback: string) => {
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
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // TODO: Add realtime subscription via WebSocket
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      const response = await getPostComments(postId, { limit: 100 });
      if (!response?.data) return;
      setComments(response.data as any);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsLoading(true);
    try {
      await createComment(postId, newComment.trim());
      setNewComment('');
      onCommentAdded?.(1);
      fetchComments();
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorDescription(error, 'Failed to post comment.'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      await likeComment(commentId);
      fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  if (!isOpen) return null;

  const CommentItem = ({ comment }: { comment: Comment }) => (
    <div className="flex gap-3">
      <Avatar url={comment.author?.avatar_url} name={comment.author?.display_name || comment.author?.username} />
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm text-foreground">
            {comment.author?.display_name || 'Unknown'}
          </span>
          {comment.author?.is_verified && comment.author?.is_creator && (
            <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20" />
          )}
          <span className="text-muted-foreground text-xs">
            @{comment.author?.username || 'unknown'}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-foreground text-sm mt-0.5">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            className="flex items-center gap-1 text-muted-foreground hover:text-rose-500 transition-colors text-xs"
            onClick={() => handleLikeComment(comment.id)}
          >
            <Heart className="w-3.5 h-3.5" />
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-t border-border px-4 py-3 space-y-4 bg-secondary/20">
      {/* Comment input */}
      {user && (
        <div className="flex gap-3">
          <Avatar url={(user as any).avatar_url} name={(user as any).display_name || user.username} />
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Post your reply..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Button
              variant="gold"
              onClick={handleSubmitComment}
              disabled={isLoading || !newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No comments yet. Be the first to reply!
          </p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
