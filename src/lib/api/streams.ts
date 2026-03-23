import { apiGet, apiPost, apiPatch, apiDelete } from '../apiClient';

export type LiveStream = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: 'scheduled' | 'live' | 'ended';
  stream_url?: string | null;
  thumbnail_url?: string | null;
  viewer_count: number;
  started_at?: string | null;
  ended_at?: string | null;
  scheduled_for?: string | null;
  created_at: string;
};

export type StreamChatMessage = {
  id: string;
  stream_id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  message: string;
  created_at: string;
};

export type StreamDonation = {
  id: string;
  stream_id: string;
  user?: { id: string; username: string; display_name: string };
  amount: string;
  currency: string;
  message?: string | null;
  created_at: string;
};

export type StreamsResponse = {
  data: LiveStream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getStreams = async (params?: {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'live' | 'ended';
  sort?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<StreamsResponse>(`/streams/${query ? `?${query}` : ''}`);
};

export const getStream = async (streamId: string) => {
  return apiGet<LiveStream>(`/streams/${streamId}/`);
};

export const startStream = async (payload: {
  title: string;
  description?: string;
  stream_url?: string;
}) => {
  return apiPost<LiveStream>('/streams/', { body: payload });
};

export const updateStream = async (streamId: string, payload: Partial<LiveStream>) => {
  return apiPatch<LiveStream>(`/streams/${streamId}/`, { body: payload });
};

export const deleteStream = async (streamId: string) => {
  return apiDelete<void>(`/streams/${streamId}/`);
};

/** Get chat messages for a stream */
export const getStreamChat = async (streamId: string, params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const query = queryParams.toString();
  return apiGet<{ data: StreamChatMessage[]; pagination: any }>(
    `/streams/${streamId}/chat/${query ? `?${query}` : ''}`
  );
};

/** Send a chat message to a stream */
export const sendStreamChat = async (streamId: string, message: string) => {
  return apiPost<StreamChatMessage>(`/streams/${streamId}/chat/`, { body: { message } });
};

/** Get donations for a stream */
export const getStreamDonations = async (streamId: string) => {
  return apiGet<{ data: StreamDonation[]; pagination: any }>(`/streams/${streamId}/donations/`);
};

/** Send a donation to a stream */
export const sendStreamDonation = async (
  streamId: string,
  payload: { amount: number; currency?: string; message?: string }
) => {
  return apiPost<StreamDonation>(`/streams/${streamId}/donations/`, { body: payload });
};

/** Notify server that current user joined the stream */
export const joinStream = async (streamId: string) => {
  return apiPost<{ success: boolean; viewer_count: number }>(
    `/streams/${streamId}/viewer-join/`,
    { body: { event_type: 'join' } }
  );
};

/** Notify server that current user left the stream */
export const leaveStream = async (streamId: string) => {
  return apiPost<{ success: boolean; viewer_count: number }>(
    `/streams/${streamId}/viewer-leave/`,
    { body: { event_type: 'leave' } }
  );
};
