import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications as apiClearAllNotifications,
} from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications';

export type { Notification };

const POLL_INTERVAL_MS = 30_000; // poll every 30 seconds

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUnreadRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const response = await getNotifications({ limit: 50 });
      const items: Notification[] = Array.isArray(response)
        ? response
        : (response as any)?.data ?? [];

      setNotifications(items);

      const newUnread = items.filter((n) => !n.read).length;
      setUnreadCount(newUnread);

      // Show a toast if new unread notifications arrived during polling
      if (prevUnreadRef.current > 0 && newUnread > prevUnreadRef.current) {
        const newest = items.find((n) => !n.read);
        if (newest) {
          toast({
            title: newest.title,
            description: newest.message,
            duration: 4000,
          });
        }
      }
      prevUnreadRef.current = newUnread;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      await apiDeleteNotification(notificationId);
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        const newUnread = updated.filter((n) => !n.read).length;
        setUnreadCount(newUnread);
        prevUnreadRef.current = newUnread;
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      await apiClearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}
