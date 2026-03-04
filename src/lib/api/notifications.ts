import { apiGet, apiPatch, apiPost } from '../apiClient';

export type Notification = {
  id: string;
  user_id: string;
  notification_type: 'like' | 'comment' | 'follow' | 'share';
  title: string;
  message: string;
  related_resource_type?: string;
  related_resource_id?: string;
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
  return apiPatch<Notification>(`/notifications/${notificationId}`, { body: { read: true } });
};

export const markAllNotificationsRead = async () => {
  return apiPost<{ success: boolean }>('/notifications/mark-all-read/');
};
