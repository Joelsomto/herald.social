import { apiGet, apiPost } from '../apiClient';

export type NewsArticle = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  source_type: string;
  image_url: string | null;
  external_url: string | null;
  published_at: string;
  likes_count?: number;
  category?: string;
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

function normaliseNews(raw: unknown): NewsResponse {
  if (Array.isArray(raw)) {
    return { data: raw as NewsArticle[], pagination: { page: 1, limit: raw.length, total: raw.length, total_pages: 1 } };
  }
  const r = raw as any;
  const list: NewsArticle[] = r.data ?? r.results ?? r.articles ?? [];
  const total = r.total ?? r.count ?? list.length;
  return {
    data: list,
    pagination: {
      page: r.page ?? 1,
      limit: r.limit ?? list.length,
      total,
      total_pages: r.total_pages ?? Math.ceil(total / Math.max(list.length, 1)),
    },
  };
}

export const getNews = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}): Promise<NewsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  const raw = await apiGet<unknown>(`/news/${query ? `?${query}` : ''}`);
  return normaliseNews(raw);
};

export const getNewsArticle = async (articleId: string) => {
  return apiGet<NewsArticle>(`/news/${articleId}/`);
};

export const likeNewsArticle = async (articleId: string) => {
  return apiPost<{ success: boolean; likes_count: number }>(`/news/${articleId}/like/`, { body: {} });
};

export const bookmarkNewsArticle = async (articleId: string) => {
  return apiPost<{ success: boolean }>(`/news/${articleId}/bookmark/`, { body: {} });
};
