import { useEffect, useState, useCallback } from 'react';
// Supabase removed
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  actor_verified: boolean;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // TODO: Integrate real-time notifications with new backend
  const fetchNotifications = useCallback(async () => {
    setLoading(false);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    // TODO: Subscribe to real-time notifications with new backend
    fetchNotifications();
  }, [user, fetchNotifications, toast]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Create notification helper for other parts of the app
  const createNotification = useCallback(async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    if (!user) return;

    // Get current user's profile for actor info
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, avatar_url, is_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      title,
      message,
      actor_id: user.id,
      actor_name: profile?.display_name || 'Someone',
      actor_avatar: profile?.avatar_url,
      actor_verified: profile?.is_verified || false,
      reference_id: referenceId,
      reference_type: referenceType,
    });
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification,
    refetch: fetchNotifications,
  };
}