import { apiGet, apiPatch, apiPost, apiDelete } from '../apiClient';

export type Notification = {
  id: string;
  user_id: string;
  notification_type: 'like' | 'comment' | 'follow' | 'share' | 'reward' | 'system';
  /** Alias for notification_type, included by the serializer */
  type: 'like' | 'comment' | 'follow' | 'share' | 'reward' | 'system';
  title: string;
  message: string;
  related_resource_type?: string | null;
  related_resource_id?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  actor_verified: boolean;
  read: boolean;
  created_at: string;
};

export type NotificationsResponse = {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getNotifications = async (params?: { page?: number; limit?: number; read?: boolean }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.read !== undefined) queryParams.append('read', params.read.toString());

  const query = queryParams.toString();
  return apiGet<NotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
};

export const markNotificationRead = async (notificationId: string) => {
  return apiPatch<Notification>(`/notifications/${notificationId}/`, { body: { read: true } });
};

export const markAllNotificationsRead = async () => {
  return apiPost<{ success: boolean }>('/notifications/mark-all-read/');
};

export const deleteNotification = async (notificationId: string) => {
  return apiDelete<void>(`/notifications/${notificationId}/`);
};

export const clearAllNotifications = async () => {
  return apiDelete<{ success: boolean; deleted: number }>('/notifications/clear-all/');
};
