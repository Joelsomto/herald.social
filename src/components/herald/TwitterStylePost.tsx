import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  MessageCircleMore,
  Repeat2,
  Share,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  Sparkles,
  Bookmark,
  Facebook,
  Linkedin,
  Link2,
  Send,
  Twitter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  bookmarks?: number;
  httnEarned: number;
  createdAt: Date;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  onLike?: (id: string) => void;
  onRepost?: (id: string) => void;
  onComment?: (id: string) => void;
  onCommentAdded?: (id: string, countDelta?: number) => void;
  onBookmark?: (id: string) => void;
  onShare?: (id: string, target?: ShareTarget) => void;
}

export type ShareTarget = 'whatsapp' | 'x' | 'facebook' | 'linkedin' | 'telegram' | 'copy' | 'native';

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
  bookmarks = 0,
  httnEarned,
  createdAt,
  isLiked: initialLiked = false,
  isReposted: initialReposted = false,
  isBookmarked: initialBookmarked = false,
  onLike,
  onRepost,
  onComment,
  onCommentAdded,
  onBookmark,
  onShare,
}: TwitterStylePostProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isReposted, setIsReposted] = useState(initialReposted);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(likes);
  const [repostCount, setRepostCount] = useState(reposts);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);
  const [bookmarkCount, setBookmarkCount] = useState(bookmarks);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setIsReposted(initialReposted);
  }, [initialReposted]);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  useEffect(() => {
    setRepostCount(reposts);
  }, [reposts]);

  useEffect(() => {
    setCommentCount(comments);
  }, [comments]);

  useEffect(() => {
    setBookmarkCount(bookmarks);
  }, [bookmarks]);

  const handleLike = () => {
    if (!onLike) return;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(id);
  };

  const handleRepost = () => {
    if (!onRepost || isReposted) return;
    setIsReposted(!isReposted);
    setRepostCount(prev => prev + 1);
    onRepost(id);
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    onComment?.(id);
  };

  const handleShareSelect = (target: ShareTarget) => {
    onShare?.(id, target);
    setShareDialogOpen(false);
  };

  const handleBookmark = () => {
    if (!onBookmark) return;
    setIsBookmarked(!isBookmarked);
    setBookmarkCount(prev => isBookmarked ? Math.max(0, prev - 1) : prev + 1);
    onBookmark(id);
  };

  return (
    <article className="px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/user/${author.username}`} className="flex-shrink-0">
          <img
            src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName || author.username || 'User')}&background=E0E7FF&color=3730A3&bold=true`}
            alt={author.displayName}
            className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
          />
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

            {onBookmark && (
              <button 
                onClick={handleBookmark}
                className={`flex items-center gap-1 transition-colors group ${
                  isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <div className="p-2 rounded-full group-hover:bg-primary/10">
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-sm">{bookmarkCount > 0 ? bookmarkCount : ''}</span>
              </button>
            )}

            {onShare && (
              <>
                <button
                  onClick={() => setShareDialogOpen(true)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-blue-400 transition-colors group"
                  aria-label="Share post"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                    <Share className="w-4 h-4" />
                  </div>
                </button>

                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Share Post</DialogTitle>
                      <DialogDescription>Choose where you want to share this post.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('whatsapp')}>
                        <MessageCircleMore className="h-4 w-4 text-green-600" />
                        Share to WhatsApp
                      </Button>
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('x')}>
                        <Twitter className="h-4 w-4 text-foreground" />
                        Share to X
                      </Button>
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('facebook')}>
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Share to Facebook
                      </Button>
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('linkedin')}>
                        <Linkedin className="h-4 w-4 text-sky-600" />
                        Share to LinkedIn
                      </Button>
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('telegram')}>
                        <Send className="h-4 w-4 text-cyan-600" />
                        Share to Telegram
                      </Button>
                      <Button variant="outline" className="justify-start gap-3" onClick={() => handleShareSelect('copy')}>
                        <Link2 className="h-4 w-4 text-foreground" />
                        Copy link
                      </Button>
                      <Button variant="gold" className="justify-start gap-3" onClick={() => handleShareSelect('native')}>
                        <Share2 className="h-4 w-4 text-primary" />
                        More options
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {/* Inline Comments Section */}
          {showComments && (
            <div className="mt-3 border-t border-border pt-3">
              <CommentsSection 
                postId={id} 
                onCommentAdded={(countDelta = 1) => {
                  setCommentCount(prev => prev + countDelta);
                  onCommentAdded?.(id, countDelta);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
