import { apiGet, apiPost, apiDelete } from '../apiClient';
import { ApiError } from '../apiClient';

export type Post = {
  id: string;
  author_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'reel' | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  httn_earned: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  };
};

export type PostsResponse = {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getPosts = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  media_type?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.media_type) queryParams.append('media_type', params.media_type);

  const query = queryParams.toString();
  return apiGet<PostsResponse | Post[]>(`/posts/${query ? `?${query}` : ''}`);
};

export const getCurrentUserPosts = async (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiGet<PostsResponse>(`/users/me/posts/${query ? `?${query}` : ''}`);
};

export const createPost = async (payload: {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'reel';
}) => {
  return apiPost<Post>('/posts/', { body: payload });
};

export const deletePost = async (postId: string) => {
  return apiDelete<{ success: boolean }>(`/posts/${postId}/`);
};

export const likePost = async (postId: string) => {
  return apiPost<{ success: boolean; likes_count: number }>(`/posts/${postId}/like/`);
};

export const unlikePost = async (postId: string) => {
  return apiDelete<{ success: boolean; likes_count: number }>(`/posts/${postId}/like/`);
};

export const sharePost = async (postId: string) => {
  return apiPost<{ success: boolean; shares_count: number }>(`/posts/${postId}/share/`);
};

export const bookmarkPost = async (postId: string) => {
  return apiPost<{ success: boolean }>(`/posts/${postId}/bookmark/`, {
    body: {},
  });
};
