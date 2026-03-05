import { apiGet, apiPost, apiDelete } from '../apiClient';

export type Community = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  created_by: string;
  image_url?: string | null;
  is_private: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunitiesResponse = {
  data: Community[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getCommunities = async (params?: { page?: number; limit?: number; sort?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<CommunitiesResponse>(`/communities${query ? `?${query}` : ''}`);
};

export const getCommunity = async (communityId: string) => {
  return apiGet<Community>(`/communities/${communityId}`);
};

export const createCommunity = async (payload: {
  name: string;
  description?: string;
  category: string;
  is_private?: boolean;
  image_url?: string;
}) => {
  return apiPost<Community>('/communities', { body: payload });
};

export const joinCommunity = async (communityId: string) => {
  return apiPost<{ success: boolean; member_count: number }>(`/communities/${communityId}/join/`, {
    body: {},
  });
};

export const leaveCommunity = async (communityId: string) => {
  return apiDelete<{ success: boolean; member_count: number }>(`/communities/${communityId}/join/`);
};
