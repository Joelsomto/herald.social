import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Gift,
  MoreHorizontal,
} from 'lucide-react';
import { Post } from '@/types/herald';
import { CreatorProfileCard } from './CreatorProfileCard';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onTip?: (postId: string) => void;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostCard({ post, onLike, onShare, onTip }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [showTipModal, setShowTipModal] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  return (
    <article className="herald-card p-5 space-y-4 animate-fade-in">
      {/* Author header */}
      <div className="flex items-start justify-between">
        <CreatorProfileCard user={post.author} compact />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(post.createdAt)}
          </span>
          <button className="p-1 rounded hover:bg-secondary transition-colors">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="text-foreground leading-relaxed">{post.content}</div>

      {/* Earnings badge */}
      {post.httnEarned > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary glow-gold-sm" />
          <span className="text-sm font-medium gold-text">
            +{post.httnEarned} HTTN earned
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isLiked
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likes}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>

          <button
            onClick={() => onShare?.(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              post.isShared
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>

        <Button
          variant="gold-ghost"
          size="sm"
          onClick={() => setShowTipModal(true)}
          className="gap-1.5"
        >
          <Gift className="w-4 h-4" />
          Tip Creator
        </Button>
      </div>

      {/* Tip modal placeholder */}
      {showTipModal && (
        <div className="mt-3 p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-sm text-foreground mb-3">
            Send a tip to @{post.author.username}
          </p>
          <div className="flex items-center gap-2">
            {[10, 50, 100, 250].map((amount) => (
              <button
                key={amount}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => {
                  onTip?.(post.id);
                  setShowTipModal(false);
                }}
              >
                {amount} HTTN
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
