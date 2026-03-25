import { Link } from 'react-router-dom';
import { BadgeCheck, MessageCircle } from 'lucide-react';

interface ReplyAuthor {
  displayName: string;
  username: string;
  avatar: string | null;
  isVerified?: boolean;
  isGoldVerified?: boolean;
}

interface ReplyActivity {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  post_id: string;
  post_content: string;
  post_media_url?: string | null;
  post_author_username: string;
  post_author_display_name: string;
  post_author_avatar_url?: string | null;
}

interface ProfileReplyCardProps {
  author: ReplyAuthor;
  reply: ReplyActivity;
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProfileReplyCard({ author, reply }: ProfileReplyCardProps) {
  const avatarSrc =
    author.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName || author.username || 'User')}&background=E0E7FF&color=3730A3&bold=true`;

  return (
    <article className="border-b border-border px-4 py-4">
      <div className="flex gap-3">
        <img
          src={avatarSrc}
          alt={author.displayName}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-foreground">{author.displayName}</span>
            {author.isGoldVerified && <BadgeCheck className="h-4 w-4 fill-primary/20 text-primary" />}
            {author.isVerified && !author.isGoldVerified && <BadgeCheck className="h-4 w-4 text-blue-400" />}
            <span className="text-muted-foreground">@{author.username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{formatTime(reply.created_at)}</span>
          </div>

          <p className="mt-1 text-sm text-primary">Replying to @{reply.post_author_username}</p>
          <p className="mt-2 whitespace-pre-wrap text-foreground">{reply.content}</p>

          <Link
            to={`/post/${reply.post_id}`}
            className="mt-3 block rounded-2xl border border-border p-3 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{reply.post_author_display_name}</span>
              <span>@{reply.post_author_username}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-foreground">{reply.post_content}</p>
            {reply.post_media_url && (
              <img
                src={reply.post_media_url}
                alt=""
                className="mt-3 max-h-56 w-full rounded-xl object-cover"
              />
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
