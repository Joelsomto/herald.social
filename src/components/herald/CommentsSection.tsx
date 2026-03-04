import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, BadgeCheck, Send } from 'lucide-react';
import { getPostComments, createComment, likeComment } from '@/lib/api/comments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author_id: string;
  parent_comment_id: string | null;
  author?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    is_creator: boolean | null;
  } | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  isOpen?: boolean;
  onClose?: () => void;
  onCommentAdded?: () => void;
}

export function CommentsSection({ postId, isOpen = true, onClose, onCommentAdded }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // Organize comments into threads (assuming flat structure from API)
      const topLevel = response.data.filter((c: any) => !c.parent_comment_id);
      const replies = response.data.filter((c: any) => c.parent_comment_id);
      
      const threaded = topLevel.map((comment: any) => ({
        ...comment,
        replies: replies.filter((r: any) => r.parent_comment_id === comment.id),
      }));
      
      setComments(threaded as any);
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
      onCommentAdded?.();
      fetchComments();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setIsLoading(true);
    try {
      await createComment(postId, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' });
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

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground flex-shrink-0 text-sm">
        {comment.author?.display_name?.[0] || '?'}
      </div>
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
          {!isReply && (
            <button 
              className="flex items-center gap-1 text-muted-foreground hover:text-blue-400 transition-colors text-xs"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
        </div>
        
        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-3">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Button 
              size="sm" 
              variant="gold"
              onClick={() => handleSubmitReply(comment.id)}
              disabled={isLoading || !replyContent.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Replies */}
        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="border-t border-border px-4 py-3 space-y-4 bg-secondary/20">
      {/* Comment input */}
      {user && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground flex-shrink-0 text-sm">
            ?
          </div>
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