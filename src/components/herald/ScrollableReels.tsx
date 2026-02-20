import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, BadgeCheck, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  description: string;
  audio: string;
  likes: number;
  comments: number;
  shares: number;
}

const dummyReels: Reel[] = [
  {
    id: 'r1',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=700&fit=crop',
    author: { name: 'Creative Studio', username: 'creativestudio', avatar: null, isVerified: true },
    description: 'The future of content creation is here 🚀✨ #Herald #Web3Creator',
    audio: 'Original Sound - Creative Studio',
    likes: 12500,
    comments: 890,
    shares: 450,
  },
  {
    id: 'r2',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1682686581030-7fa4ea2b96c3?w=400&h=700&fit=crop',
    author: { name: 'Tech Insider', username: 'techinsider', avatar: null, isVerified: true },
    description: 'How to earn tokens while creating content 💰 Tutorial inside! #HTTN #CreatorEconomy',
    audio: 'Trending Audio - Viral Beats',
    likes: 8900,
    comments: 567,
    shares: 234,
  },
  {
    id: 'r3',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=400&h=700&fit=crop',
    author: { name: 'Digital Artist', username: 'digiart', avatar: null, isVerified: false },
    description: 'My journey from 0 to 10K followers on Herald 🎨 #ArtistLife',
    audio: 'Aesthetic Vibes - LoFi',
    likes: 5600,
    comments: 345,
    shares: 123,
  },
  {
    id: 'r4',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1682686580391-615b1f28e5ee?w=400&h=700&fit=crop',
    author: { name: 'Finance Guru', username: 'financeguru', avatar: null, isVerified: true },
    description: 'Understanding crypto rewards in 60 seconds ⏱️ #CryptoEducation',
    audio: 'Money Moves - Hip Hop',
    likes: 15200,
    comments: 1200,
    shares: 890,
  },
];

export function ScrollableReels() {
  const [currentReel, setCurrentReel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setCurrentReel(index);
            const video = videoRefs.current[index];
            if (video) {
              video.play().catch(() => {});
              setIsPlaying(true);
            }
          } else {
            const video = videoRefs.current[index];
            if (video) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    const reelElements = document.querySelectorAll('.reel-item');
    reelElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleLike = (reelId: string) => {
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
      }
      return newSet;
    });
  };

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory scrollbar-none"
    >
      {dummyReels.map((reel, index) => (
        <div
          key={reel.id}
          data-index={index}
          className="reel-item h-[calc(100vh-64px)] snap-start relative bg-black flex items-center justify-center"
        >
          {/* Video/Thumbnail */}
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={() => togglePlay(index)}
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              loop
              muted={isMuted}
              playsInline
              className="h-full w-full object-cover"
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && currentReel === index && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-16 h-16 text-white/80" fill="white" />
              </div>
            )}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Right side actions */}
          <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
            {/* Author avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-white border-2 border-white">
                {reel.author.name[0]}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">+</span>
              </div>
            </div>

            {/* Like */}
            <button 
              className="flex flex-col items-center gap-1"
              onClick={() => handleLike(reel.id)}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                likedReels.has(reel.id) ? 'bg-rose-500' : 'bg-white/10 backdrop-blur-sm'
              }`}>
                <Heart className={`w-6 h-6 ${likedReels.has(reel.id) ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs font-medium">
                {formatCount(reel.likes + (likedReels.has(reel.id) ? 1 : 0))}
              </span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatCount(reel.comments)}</span>
            </button>

            {/* Share */}
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatCount(reel.shares)}</span>
            </button>

            {/* Sound toggle */}
            <button 
              className="flex flex-col items-center gap-1"
              onClick={() => setIsMuted(!isMuted)}
            >
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-4 left-4 right-20 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{reel.author.name}</span>
              {reel.author.isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs border-white/30 text-white hover:bg-white/10 rounded-full ml-2">
                Follow
              </Button>
            </div>
            <p className="text-sm line-clamp-2 mb-2">{reel.description}</p>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Music className="w-3 h-3" />
              <span className="truncate">{reel.audio}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}