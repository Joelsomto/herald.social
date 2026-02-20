import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Sparkles,
  BadgeCheck,
  Gift,
  CheckCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { useRealTimeNotifications, Notification } from '@/hooks/useRealTimeNotifications';
import { useState } from 'react';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';

export default function Notifications() {
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead,
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useRealTimeNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'reward':
        return <Sparkles className="w-5 h-5 text-primary" />;
      case 'verification':
        return <BadgeCheck className="w-5 h-5 text-primary" />;
      case 'tip':
        return <Gift className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[0]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated on your activity • Real-time updates enabled</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    New notifications will appear here in real-time
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`bg-card border-border transition-colors cursor-pointer hover:bg-secondary/30 ${
                      !notification.read ? 'border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.actor_avatar || ''} />
                            <AvatarFallback className="bg-secondary font-display">
                              {notification.actor_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground">
                            <span className="font-semibold">
                              {notification.actor_name}
                              {notification.actor_verified && (
                                <BadgeCheck className="inline-block w-4 h-4 text-primary ml-1" />
                              )}
                            </span>{' '}
                            {notification.message}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}