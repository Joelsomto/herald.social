import { apiGet, apiPatch } from '../apiClient';
import type { ApiUser } from './types';

export const getCurrentUser = async () => {
  return apiGet<ApiUser>('/auth/users/profiles/me/');
};

export const getUserByUsername = async (username: string) => {
  return apiGet<ApiUser>(`/users/by-username/${username}`);
};

export const updateCurrentUser = async (payload: Partial<ApiUser>) => {
  return apiPatch<ApiUser>('/auth/users/profiles/me/', { body: payload });
};

export const getUserStats = async () => {
  return apiGet<{
    posts_count: number;
    followers_count: number;
    following_count: number;
    reputation: number;
  }>('/auth/users/profiles/me/stats/');
};

export const getTopUsers = async (params?: { limit?: number; sort?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<ApiUser[]>(`/users${query ? `?${query}` : ''}`);
};
