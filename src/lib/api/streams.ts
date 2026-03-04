import { apiGet, apiPost, apiPatch } from '../apiClient';

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
  return apiGet<StreamsResponse>(`/streams${query ? `?${query}` : ''}`);
};

export const getStream = async (streamId: string) => {
  return apiGet<LiveStream>(`/streams/${streamId}`);
};

export const startStream = async (payload: {
  title: string;
  description?: string;
  stream_url?: string;
}) => {
  return apiPost<LiveStream>('/streams', { body: payload });
};

export const updateStream = async (streamId: string, payload: Partial<LiveStream>) => {
  return apiPatch<LiveStream>(`/streams/${streamId}`, { body: payload });
};
