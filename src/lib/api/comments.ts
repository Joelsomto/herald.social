import { apiGet, apiPost, apiPatch, apiDelete } from '../apiClient';

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
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

export type CommentsResponse = {
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getPostComments = async (postId: string, params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiGet<CommentsResponse>(`/posts/${postId}/comments${query ? `?${query}` : ''}`);
};

export const createComment = async (postId: string, content: string, parentCommentId?: string) => {
  return apiPost<Comment>(`/posts/${postId}/comments/`, { 
    body: { 
      content,
      ...(parentCommentId && { parent_comment_id: parentCommentId })
    } 
  });
};

export const deleteComment = async (commentId: string) => {
  return apiDelete<{ success: boolean }>(`/comments/${commentId}`);
};

export const likeComment = async (commentId: string) => {
  return apiPost<{ success: boolean; likes_count: number }>(`/comments/${commentId}/like/`);
};
