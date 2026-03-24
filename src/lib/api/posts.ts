import { apiDelete, apiGet, apiPost } from '../apiClient';

export type Post = {
  id: string;
  author_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'reel' | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count?: number;
  httn_earned: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  is_verified?: boolean;
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

export const getBookmarkedPosts = async (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const query = queryParams.toString();
  return apiGet<PostsResponse>(`/bookmarks/my/${query ? `?${query}` : ''}`);
};

export const getPost = async (postId: string) => {
  return apiGet<Post>(`/posts/${postId}/`);
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
  return apiPost<{ success: boolean; liked: boolean; likes_count: number }>(`/posts/${postId}/like/`);
};

export const unlikePost = async (postId: string) => {
  return apiPost<{ success: boolean; liked: boolean; likes_count: number }>(`/posts/${postId}/unlike/`);
};

export const sharePost = async (postId: string) => {
  return apiPost<{ success: boolean; reposted: boolean; shares_count: number }>(`/posts/${postId}/share/`);
};

export const bookmarkPost = async (postId: string) => {
  return apiPost<{ success: boolean; bookmarked: boolean }>(`/posts/${postId}/bookmark/`);
};

export const unbookmarkPost = async (postId: string) => {
  return apiPost<{ success: boolean; bookmarked: boolean }>(`/posts/${postId}/unbookmark/`);
};

export const getTrendingPosts = async (limit = 20): Promise<PostsResponse> => {
  const raw = await apiGet<unknown>(`/posts/trending/?limit=${limit}`);
  return normalisePosts(raw, limit);
};

export const getFollowingPosts = async (params?: { page?: number; limit?: number }): Promise<PostsResponse> => {
  const q = new URLSearchParams();
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const raw = await apiGet<unknown>(`/posts/following/?${q.toString()}`);
  return normalisePosts(raw, params?.limit ?? 20);
};

function normalisePosts(raw: unknown, limit: number): PostsResponse {
  if (Array.isArray(raw)) {
    return { data: raw as Post[], pagination: { page: 1, limit, total: (raw as Post[]).length, total_pages: 1 } };
  }

  const r = raw as any;
  const list: Post[] = r.data ?? r.results ?? [];
  const total = r.total ?? r.count ?? list.length;
  return {
    data: list,
    pagination: {
      page: r.pagination?.page ?? r.page ?? 1,
      limit,
      total,
      total_pages: r.pagination?.total_pages ?? r.total_pages ?? Math.ceil(total / limit),
    },
  };
}
