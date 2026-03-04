import { apiGet, apiPost } from '../apiClient';

export type NewsArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
  source_url?: string | null;
  image_url?: string | null;
  likes_count: number;
  created_at: string;
};

export type NewsResponse = {
  data: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getNews = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<NewsResponse>(`/news${query ? `?${query}` : ''}`);
};

export const getNewsArticle = async (articleId: string) => {
  return apiGet<NewsArticle>(`/news/${articleId}`);
};

export const likeNewsArticle = async (articleId: string) => {
  return apiPost<{ success: boolean; likes_count: number }>(`/news/${articleId}/like`);
};

export const bookmarkNewsArticle = async (articleId: string) => {
  return apiPost<{ success: boolean }>(`/news/${articleId}/bookmark`);
};
