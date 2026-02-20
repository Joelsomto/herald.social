import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReelCardProps {
  reel: {
    id: string;
    content: string;
    media_url: string | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    httn_earned: number;
    author: {
      display_name: string;
      username: string;
      avatar_url: string | null;
    };
  };
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function ReelCard({ reel, onLike, onShare }: ReelCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(reel.id);
  };

  return (
    <div className="aspect-[9/16] rounded-xl bg-secondary relative overflow-hidden cursor-pointer group">
      {reel.media_url ? (
        <>
          <video
            ref={videoRef}
            src={reel.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />
          
          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-background/20"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
            </div>
          )}
          
          {/* Mute button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/50 hover:bg-background/70"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold border-2 border-primary">
            {reel.author?.avatar_url ? (
              <img src={reel.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              reel.author?.display_name?.[0] || '?'
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{reel.author?.display_name}</p>
            <p className="text-xs text-muted-foreground">@{reel.author?.username}</p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-foreground line-clamp-2 mb-3">{reel.content}</p>

        {/* HTTN earned */}
        <div className="flex items-center gap-1 text-xs gold-text mb-3">
          <Sparkles className="w-3 h-3" />
          {reel.httn_earned} HTTN earned
        </div>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <Button
          variant="ghost"
          size="icon"
          className={`bg-background/50 hover:bg-background/70 ${isLiked ? 'text-red-500' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
        <span className="text-xs text-center text-foreground">{reel.likes_count}</span>

        <Button
          variant="ghost"
          size="icon"
          className="bg-background/50 hover:bg-background/70"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        <span className="text-xs text-center text-foreground">{reel.comments_count}</span>

        <Button
          variant="ghost"
          size="icon"
          className="bg-background/50 hover:bg-background/70"
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(reel.id);
          }}
        >
          <Share2 className="w-5 h-5" />
        </Button>
        <span className="text-xs text-center text-foreground">{reel.shares_count}</span>
      </div>
    </div>
  );
}
