import { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Bell,
  User,
  Settings,
  Sparkles,
  LayoutDashboard,
  Wallet,
  LogOut,
  Trophy,
  Megaphone,
  Users,
  Store,
  Radio,
  Newspaper,
  HandHeart,
  Menu,
  X,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Radio, label: 'Herald Live', path: '/live' },
    { icon: Megaphone, label: 'Herald Promote', path: '/ads' },
    { icon: Users, label: 'Herald Communities', path: '/communities' },
    { icon: Newspaper, label: 'Herald News', path: '/news' },
    { icon: Store, label: 'Herald Commerce', path: '/store' },
    { icon: HandHeart, label: 'Herald Causes', path: '/causes' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleNavClick = () => {
    if (isMobile) setIsOpen(false);
  };

  // Mobile hamburger menu trigger
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-sm">
                {profile?.display_name?.[0] || user?.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Herald</span>
          </div>

          <ThemeToggle />
        </div>

        {/* Mobile Slide-out Menu */}
        {isOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-300">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-display font-bold">
                      {profile?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{profile?.display_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username || 'username'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <ScrollArea className="flex-1 py-2">
                <nav className="px-2">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-4 py-3 rounded-full text-foreground hover:bg-secondary transition-colors"
                          activeClassName="bg-secondary text-primary font-bold"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              </ScrollArea>

              {/* Bottom section */}
              <div className="p-3 border-t border-border space-y-1">
                <NavLink
                  to="/settings"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-full transition-colors"
                  activeClassName="text-primary"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </NavLink>
                {user && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 hidden lg:flex">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center gold-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Herald
          </span>
        </div>
      </div>

      {/* Navigation with scroll */}
      <ScrollArea className="flex-1 px-3">
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-lg"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-bold"
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Post Button */}
          <Button variant="gold" className="w-full mt-4 py-6 text-lg font-bold rounded-full">
            Post
          </Button>
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center justify-between px-4 py-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            activeClassName="text-sidebar-primary"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          <ThemeToggle />
        </div>
        {user && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
