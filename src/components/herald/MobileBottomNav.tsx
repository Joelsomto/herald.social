import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Radio, Users, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { icon: Home, label: 'Home', path: '/feed' },
  { icon: Radio, label: 'Live', path: '/live' },
  { icon: Users, label: 'Community', path: '/communities' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCounts = async () => {
      const [notifRes, msgRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false),
      ]);

      setUnreadNotifications(notifRes.count || 0);
      setUnreadMessages(msgRes.count || 0);
    };

    fetchUnreadCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('mobile-nav-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchUnreadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchUnreadCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getBadgeCount = (path: string) => {
    if (path === '/notifications') return unreadNotifications;
    if (path === '/dashboard') return unreadMessages;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const badgeCount = getBadgeCount(path);
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 relative transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
