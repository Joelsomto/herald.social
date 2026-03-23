import { apiGet, apiPatch, apiPost } from '../apiClient';

export type ConversationUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type Conversation = {
  user: ConversationUser;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export type MessagesResponse = {
  data: DirectMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

/** List all conversations for the current user */
export const getConversations = async (params?: { limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const query = queryParams.toString();
  return apiGet<Conversation[]>(`/messages/conversations/${query ? `?${query}` : ''}`);
};

/** Get the message thread between the current user and another user */
export const getConversation = async (
  userId: string,
  params?: { page?: number; limit?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const query = queryParams.toString();
  return apiGet<MessagesResponse>(
    `/messages/conversations/${userId}/${query ? `?${query}` : ''}`
  );
};

/** Send a direct message */
export const sendMessage = async (recipientId: string, content: string) => {
  return apiPost<DirectMessage>('/messages/', {
    body: { recipient_id: recipientId, content },
  });
};

/** Mark a single message as read */
export const markMessageRead = async (messageId: string) => {
  return apiPatch<{ success: boolean; id: string; read: boolean }>(
    `/messages/${messageId}/read/`
  );
};

/** Get the count of unread messages */
export const getUnreadMessageCount = async () => {
  return apiGet<{ unread_count: number }>('/messages/unread-count/');
};
