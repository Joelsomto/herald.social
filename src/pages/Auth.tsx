import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wallet, Zap, Users, ArrowRight, Check, Volume2, VolumeX } from 'lucide-react';
import heroBg from '@/assets/herald-hero-bg.jpg';

// Sample social video URLs for demo
const DEMO_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-happily-4640-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-young-woman-taking-selfie-while-having-coffee-42556-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-at-her-cellphone-4878-large.mp4',
];

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-play next video when current ends
    const video = videoRef.current;
    if (video) {
      const handleEnded = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % DEMO_VIDEOS.length);
      };
      video.addEventListener('ended', handleEnded);
      return () => video.removeEventListener('ended', handleEnded);
    }
  }, [currentVideoIndex]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/feed');
    } catch (error) {
      // Error handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
      navigate('/feed');
    } catch (error) {
      // Error handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Wallet, title: 'Earn HTTN Tokens', description: 'Get rewarded for your engagement' },
    { icon: Zap, title: 'Complete Tasks', description: 'Daily missions with real rewards' },
    { icon: Users, title: 'Build Community', description: 'Connect with mission-aligned creators' },
  ];

  return (
    <div className="min-h-screen flex w-full">
      {/* Left side - Hero with Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Image Background */}
        <img
          src={heroBg}
          alt="Herald Network"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center gold-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Herald</h1>
          </div>

          <h2 className="font-display text-4xl font-bold text-foreground mb-4">
            Where Your <span className="gold-text">Attention</span> Becomes{' '}
            <span className="gold-text">Value</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8">
            Join the Web3 social network where creators and communities earn real rewards 
            for meaningful engagement.
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 herald-card rounded-xl">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success" />
              <span>100 HTTN Points welcome bonus on signup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center gold-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Herald</h1>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="border-border bg-card">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-input"
                      />
                    </div>
                    <Button type="submit" variant="gold" className="w-full gap-2" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-border bg-card">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-display">Create account</CardTitle>
                  <CardDescription>
                    Join Herald and start earning rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-input"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          You'll receive <span className="gold-text font-semibold">100 HTTN Points</span> welcome bonus
                        </span>
                      </div>
                    </div>

                    <Button type="submit" variant="gold" className="w-full gap-2" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
