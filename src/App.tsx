import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SplashScreen } from "@/components/herald/SplashScreen";
import { OnboardingFlow } from "@/components/herald/OnboardingFlow";
import { getCurrentUser } from "@/lib/api/users";
import { getCurrentUserWallet } from "@/lib/api/wallets";
import { getCurrentUserPosts } from "@/lib/api/posts";
import { AnimatePresence } from "framer-motion";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import Notifications from "./pages/Notifications";
import Ads from "./pages/Ads";
import Admin from "./pages/Admin";
import UserProfile from "./pages/UserProfile";
import EStore from "./pages/EStore";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Live from "./pages/Live";
import Communities from "./pages/Communities";
import Causes from "./pages/Causes";
import News from "./pages/News";
import DbTest from "./pages/DbTest";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Show splash screen for 2 seconds minimum
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !loading) {
        try {
          let completed = false;
          
          // Safety timeout - if checks take too long, assume completed
          const timeoutId = setTimeout(() => {
            console.warn('Onboarding check timeout - marking as completed');
            setCheckingOnboarding(false);
          }, 10000);
          
          // Skip user_interests check - table may not exist yet
          // Assume completed if they have profile + wallet
          
          // Returning user: they have a profile, wallet, or posts
          const results = await Promise.allSettled([
            getCurrentUser(),
            getCurrentUserWallet(),
            getCurrentUserPosts({ limit: 1 }),
          ]);

          clearTimeout(timeoutId);

          const profile = results[0].status === 'fulfilled' ? results[0].value : null;
          const hasWallet = results[1].status === 'fulfilled';
          const hasPosts = results[2].status === 'fulfilled' && results[2].value?.data?.length > 0;
          const profileAgeMs = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : 0;
          const isReturningUser =
            (profile != null && profileAgeMs > 60_000) || hasWallet || hasPosts;

          if (isReturningUser) {
            completed = true;
          }
          
          console.log('Onboarding check completed:', { completed, hasWallet, hasPosts, profileAge: profileAgeMs });
          if (!completed) setShowOnboarding(true);
        } catch (error) {
          console.error('Error checking onboarding:', error);
        } finally {
          setCheckingOnboarding(false);
        }
      } else if (!loading) {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, loading]);

  // Show splash screen during loading or initial check
  if (loading || showSplash || checkingOnboarding) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" />
      </AnimatePresence>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <AnimatePresence mode="wait">
        <OnboardingFlow 
          key="onboarding"
          onComplete={() => setShowOnboarding(false)} 
        />
      </AnimatePresence>
    );
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash-auth" />
      </AnimatePresence>
    );
  }

  if (user) return <Navigate to="/feed" replace />;
  
  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash-main" />
      </AnimatePresence>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Index />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><EStore /></ProtectedRoute>} />
      <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
      <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
      <Route path="/causes" element={<ProtectedRoute><Causes /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/db-test" element={<DbTest />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
