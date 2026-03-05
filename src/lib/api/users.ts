import { apiGet, apiPatch, apiPost, apiDelete } from '../apiClient';
import type { ApiUser } from './types';
import type { Post, PostsResponse } from './posts';
import type { UserTask, TasksResponse } from './tasks';

export const getCurrentUser = async () => {
  return apiGet<ApiUser>('/auth/users/profiles/me/');
};

export const getUserById = async (userId: string) => {
  return apiGet<ApiUser>(`/users/${userId}/`);
};

export const getUserByUsername = async (username: string) => {
  return apiGet<ApiUser>(`/users/by-username/${username}`);
};

export const updateCurrentUser = async (payload: Partial<ApiUser>) => {
  return apiPatch<ApiUser>('/users/me/', { body: payload });
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  // Custom fetch for multipart/form-data since apiPost uses JSON
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`;
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://herald-backend-6i3m.onrender.com/api/v1'}/users/me/avatar/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }

  return response.json() as Promise<{ success: boolean; avatar_url: string }>;
};

export const deleteCurrentUser = async () => {
  return apiDelete<{ success: boolean }>('/auth/users/profiles/me/');
};

export const getUserSettings = async () => {
  return apiGet<Record<string, any>>('/users/me/settings/');
};

export const updateUserSettings = async (payload: Record<string, any>) => {
  return apiPatch<Record<string, any>>('/users/me/settings/', { body: payload });
};

export const getUserStats = async () => {
  return apiGet<{
    posts_count: number;
    followers_count: number;
    following_count: number;
    reputation: number;
  }>('/auth/users/profiles/me/stats/');
};

export const getUserByIdStats = async (userId: string) => {
  return apiGet<{
    posts_count: number;
    followers_count: number;
    following_count: number;
    reputation: number;
  }>(`/users/${userId}/stats/`);
};

export const getCurrentUserPosts = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<PostsResponse>(`/users/me/posts/${query ? `?${query}` : ''}`);
};

export const getUserPosts = async (userId: string, params?: {
  page?: number;
  limit?: number;
  sort?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<PostsResponse>(`/users/${userId}/posts/${query ? `?${query}` : ''}`);
};

export const getCurrentUserTasks = async (params?: {
  completed?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());

  const query = queryParams.toString();
  return apiGet<TasksResponse>(`/users/me/tasks/${query ? `?${query}` : ''}`);
};

export const getUserTasks = async (userId: string, params?: {
  completed?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());

  const query = queryParams.toString();
  return apiGet<TasksResponse>(`/users/${userId}/tasks/${query ? `?${query}` : ''}`);
};

export const getTopUsers = async (params?: { limit?: number; sort?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<ApiUser[]>(`/users${query ? `?${query}` : ''}`);
};
