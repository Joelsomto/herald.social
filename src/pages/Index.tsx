import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sparkles,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  BadgeCheck,
  Lock,
  ArrowRight,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import heroBg from '@/assets/herald-hero-bg.jpg';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// ────────────────────────────────────────────────
// Dummy data – only used when NOT logged in
// ────────────────────────────────────────────────
const previewPosts = [
  {
    id: 'p1',
    author: { name: 'Herald Official', username: 'herald', verified: true, avatar: 'H' },
    content:
      '🚀 Just launched our community impact report! This quarter we helped 500+ creators earn their first HTTN tokens. The future of creator economy is here.',
    likes: 1234,
    comments: 89,
    reposts: 234,
    httn: 450,
    time: '2h',
  },
  {
    id: 'p2',
    author: { name: 'Sarah Chen', username: 'sarahcreates', verified: true, avatar: 'S' },
    content:
      'Every contribution matters. Every voice counts. Today I learned that my small daily actions have compounded into real impact. Thank you, Herald community. 💛',
    likes: 567,
    comments: 45,
    reposts: 123,
    httn: 320,
    time: '4h',
  },
  {
    id: 'p3',
    author: { name: 'Alex Rivera', username: 'alexr', verified: true, avatar: 'A' },
    content:
      "Web3 isn't about speculation. It's about ownership. It's about creators finally getting what they deserve. Herald gets it. 🙌",
    likes: 892,
    comments: 67,
    reposts: 189,
    httn: 560,
    time: '6h',
  },
  {
    id: 'p4',
    author: { name: 'Jordan Taylor', username: 'jtaylor', verified: false, avatar: 'J' },
    content: 'Completed my weekly tasks and got bonus tokens! Who else is grinding? 💪 #HTTNRewards',
    likes: 156,
    comments: 18,
    reposts: 12,
    httn: 80,
    time: '8h',
  },
];

// ────────────────────────────────────────────────
// Simple type for real posts coming from Supabase
// Adjust fields according to your actual generated types
// ────────────────────────────────────────────────
type FeedPost = {
  id: number | string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  reposts_count: number;
  httn_earned?: number; // placeholder – can come from join / calculation later
  users: {
    username: string;
    full_name: string | null;
    verified: boolean;
    avatar_url: string | null;
  };
};

interface PreviewPostProps {
  post: typeof previewPosts[0];
  onInteract: () => void;
}

function PreviewPost({ post, onInteract }: PreviewPostProps) {
  return (
    <div className="p-4 border-b border-border hover:bg-secondary/30 transition-colors">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/20 text-primary font-display font-bold">
            {post.author.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-foreground">{post.author.name}</span>
            {post.author.verified && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
            )}
            <span className="text-muted-foreground text-sm">@{post.author.username}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{post.time}</span>
          </div>
          <p className="text-foreground mt-1 break-words">{post.content}</p>

          <div className="flex items-center justify-between mt-3 max-w-md">
            <button
              onClick={onInteract}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.comments}</span>
            </button>
            <button
              onClick={onInteract}
              className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.reposts}</span>
            </button>
            <button
              onClick={onInteract}
              className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.likes}</span>
            </button>
            <button
              onClick={onInteract}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>+{post.httn} HTTN</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Wallet, title: 'Earn HTTN Tokens', description: 'Get rewarded for your engagement' },
  { icon: Zap, title: 'Complete Tasks', description: 'Daily missions with real rewards' },
  { icon: Users, title: 'Build Community', description: 'Connect with mission-aligned creators' },
];

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [realPosts, setRealPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const handleInteract = () => {
    if (!user) {
      setShowAuthPrompt(true);
    }
    // else → later: open compose modal, like post, etc.
  };

  // ────────────────────────────────────────────────
  // Fetch real feed when authenticated
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || authLoading) return;

    async function fetchFeed() {
      setLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            likes_count,
            replies_count,
            reposts_count,
            users!inner (
              username,
              full_name,
              verified,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        if (error) throw error;

        const formatted = (data || []).map((p: any) => ({
          ...p,
          httn_earned: Math.floor(Math.random() * 500) + 50, // placeholder – replace later
        }));

        setRealPosts(formatted);
      } catch (err) {
        console.error('Error loading feed:', err);
      } finally {
        setLoadingPosts(false);
      }
    }

    fetchFeed();

    // Basic realtime – new posts appear
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-background">
      {/* ──────────────────────────────────────────────── */}
      {/* Auth modal when user tries to interact without being logged in */}
      {/* ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuthPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAuthPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${heroBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                <div className="relative p-8 text-center space-y-6">
                  <motion.div
                    className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center gold-glow"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </motion.div>

                  <div>
                    <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                      Join Herald
                    </h2>
                    <p className="text-muted-foreground">
                      Where your <span className="gold-text font-semibold">attention</span> becomes{' '}
                      <span className="gold-text font-semibold">value</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-display font-bold gold-text">100 HTTN Points</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Welcome bonus on signup!</p>
                  </div>

                  <div className="space-y-3">
                    <Button variant="gold" className="w-full gap-2" onClick={() => navigate('/auth')}>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  </div>

                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Continue browsing
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────── */}
      {/* Main content */}
      {/* ──────────────────────────────────────────────── */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left sidebar – desktop only */}
        <aside className="hidden lg:block w-64 sticky top-0 h-screen border-r border-border p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center gold-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Herald</h1>
          </div>

          <nav className="space-y-2">
            {['Home', 'Explore', 'Notifications', 'Messages', 'Profile', 'Wallet'].map((item, i) => (
              <button
                key={item}
                onClick={i > 0 ? handleInteract : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  i === 0
                    ? 'bg-secondary text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {item}
                {i > 0 && <Lock className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="mt-8">
            <Button variant="gold" className="w-full rounded-full gap-2" onClick={handleInteract}>
              <Lock className="w-4 h-4" />
              Post
            </Button>
          </div>
        </aside>

        {/* Main feed */}
        <main className="flex-1 min-w-0 border-r border-border">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="font-display font-bold text-xl text-foreground">Home</h1>
              </div>
              {!isAuthenticated && (
                <Button variant="gold" size="sm" className="rounded-full gap-2" onClick={() => navigate('/auth')}>
                  Sign Up
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </header>

          {/* Compose / What's happening area */}
          {isAuthenticated ? (
            <div
              className="border-b border-border p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => navigate('/compose') || handleInteract()}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{user?.email?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 py-3 px-4 rounded-full bg-secondary/50 text-muted-foreground">
                  What's happening?
                </div>
              </div>
            </div>
          ) : (
            <div
              className="border-b border-border p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={handleInteract}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 py-3 px-4 rounded-full bg-secondary/50 text-muted-foreground">
                  Sign in to post...
                </div>
              </div>
            </div>
          )}

          {/* Feed content */}
          {isAuthenticated ? (
            <>
              {loadingPosts ? (
                <div className="p-8 text-center text-muted-foreground">Loading feed...</div>
              ) : realPosts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No posts yet. Be the first!</div>
              ) : (
                realPosts.map((post) => (
                  <div key={post.id} className="p-4 border-b border-border hover:bg-secondary/30">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {post.users.username?.[0]?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-semibold">{post.users.full_name || post.users.username}</span>
                          {post.users.verified && (
                            <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                          )}
                          <span className="text-muted-foreground text-sm">@{post.users.username}</span>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-muted-foreground text-sm">
                            {new Date(post.created_at).toLocaleString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-foreground mt-1 break-words">{post.content}</p>

                        <div className="flex items-center justify-between mt-3 max-w-md">
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                            <MessageCircle className="w-4 h-4" /> {post.replies_count}
                          </button>
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500">
                            <Repeat2 className="w-4 h-4" /> {post.reposts_count}
                          </button>
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500">
                            <Heart className="w-4 h-4" /> {post.likes_count}
                          </button>
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                            <Share className="w-4 h-4" />
                          </button>
                        </div>

                        {post.httn_earned && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            <span>+{post.httn_earned} HTTN</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            // ────────────────────────────────────────────────
            // Preview mode (not logged in)
            // ────────────────────────────────────────────────
            <div>
              {previewPosts.map((post) => (
                <PreviewPost key={post.id} post={post} onInteract={handleInteract} />
              ))}
            </div>
          )}

          {/* More content teaser when not logged in */}
          {!isAuthenticated && (
            <div className="p-8 text-center border-t border-border">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground">See more on Herald</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up to discover more content, follow creators, and start earning rewards.
                </p>
                <Button variant="gold" onClick={() => navigate('/auth')} className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar – desktop only */}
        <aside className="hidden xl:block w-80 sticky top-0 h-screen p-4">
          <div className="space-y-4">
            {/* Sign up card */}
            {!isAuthenticated && (
              <div className="herald-card p-4 space-y-3">
                <h3 className="font-display font-semibold text-foreground">New to Herald?</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up now to earn rewards for your engagement.
                </p>
                <Button variant="gold" className="w-full gap-2" onClick={() => navigate('/auth')}>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            )}

            {/* Trending – placeholder / can be made real later */}
            <div className="herald-card p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Trending</h3>
              <div className="space-y-3">
                {['#HTTNRewards', '#Web3Social', '#CreatorEconomy', '#Herald'].map((tag) => (
                  <div
                    key={tag}
                    className="cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
                    onClick={handleInteract}
                  >
                    <p className="font-semibold text-foreground text-sm">{tag}</p>
                    <p className="text-xs text-muted-foreground">Trending in Tech</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Who to follow – placeholder */}
            <div className="herald-card p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Who to follow</h3>
              <div className="space-y-3">
                {[
                  { name: 'Herald Official', username: 'herald' },
                  { name: 'Sarah Chen', username: 'sarahcreates' },
                  { name: 'Alex Rivera', username: 'alexr' },
                ].map((user) => (
                  <div key={user.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {user.name}
                          <BadgeCheck className="w-3 h-3 text-primary fill-primary/20" />
                        </p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={handleInteract}>
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3">
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button variant="gold" className="flex-1 gap-2" onClick={() => navigate('/auth')}>
            Sign Up
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}