import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  BadgeCheck,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommentsSection } from './CommentsSection';

interface Author {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  isVerified?: boolean;
  isGoldVerified?: boolean;
}

interface TwitterStylePostProps {
  id: string;
  author: Author;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: number;
  reposts: number;
  httnEarned: number;
  createdAt: Date;
  isLiked?: boolean;
  isReposted?: boolean;
  onLike?: (id: string) => void;
  onRepost?: (id: string) => void;
  onComment?: (id: string) => void;
}

function formatTimeAgo(date: Date): string {
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

export function TwitterStylePost({
  id,
  author,
  content,
  mediaUrl,
  mediaType,
  likes,
  comments,
  reposts,
  httnEarned,
  createdAt,
  isLiked: initialLiked = false,
  isReposted: initialReposted = false,
  onLike,
  onRepost,
  onComment,
}: TwitterStylePostProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isReposted, setIsReposted] = useState(initialReposted);
  const [likeCount, setLikeCount] = useState(likes);
  const [repostCount, setRepostCount] = useState(reposts);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(id);
  };

  const handleRepost = () => {
    setIsReposted(!isReposted);
    setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
    onRepost?.(id);
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    onComment?.(id);
  };

  return (
    <article className="px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/user/${author.username}`} className="flex-shrink-0">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.displayName}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-foreground hover:opacity-80 transition-opacity">
              {author.displayName[0]}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <Link to={`/user/${author.username}`} className="font-semibold text-foreground hover:underline">
                {author.displayName}
              </Link>
              {author.isGoldVerified && (
                <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
              )}
              {author.isVerified && !author.isGoldVerified && (
                <BadgeCheck className="w-5 h-5 text-blue-400" />
              )}
              <Link to={`/user/${author.username}`} className="text-muted-foreground hover:underline">
                @{author.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground hover:underline">
                {formatTimeAgo(createdAt)}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Not interested</DropdownMenuItem>
                <DropdownMenuItem>Follow @{author.username}</DropdownMenuItem>
                <DropdownMenuItem>Mute @{author.username}</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post content */}
          <p className="text-foreground mt-0.5 whitespace-pre-wrap">{content}</p>

          {/* Media */}
          {mediaUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full max-h-[500px] object-cover"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt=""
                  className="w-full max-h-[500px] object-cover"
                />
              )}
            </div>
          )}

          {/* HTTN Earned */}
          {httnEarned > 0 && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary glow-gold-sm" />
              <span className="text-xs font-medium gold-text">+{httnEarned} HTTN</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 max-w-md">
            <button
              onClick={handleToggleComments}
              className={`flex items-center gap-1 transition-colors group ${
                showComments ? 'text-blue-400' : 'text-muted-foreground hover:text-blue-400'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{commentCount > 0 ? commentCount : ''}</span>
            </button>

            <button
              onClick={handleRepost}
              className={`flex items-center gap-1 transition-colors group ${
                isReposted ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-green-400/10">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">{repostCount > 0 ? repostCount : ''}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors group ${
                isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-rose-500/10">
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{likeCount > 0 ? likeCount : ''}</span>
            </button>

            <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                <Bookmark className="w-4 h-4" />
              </div>
            </button>

            <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Inline Comments Section */}
          {showComments && (
            <div className="mt-3 border-t border-border pt-3">
              <CommentsSection 
                postId={id} 
                onCommentAdded={() => setCommentCount(prev => prev + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
