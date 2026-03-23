import { apiGet, apiPost, apiPatch, apiDelete } from '../apiClient';

export type Ad = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_text: string;
  target_url: string | null;
  sponsor_name: string | null;
  reward_points: number;
  is_featured: boolean;
  budget_points: number;
  spent_points: number;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

/** Public: fetch currently active ads for display */
export const getActiveAds = async (limit = 6): Promise<Ad[]> => {
  const res = await apiGet<Ad[] | { results?: Ad[]; data?: Ad[] }>(`/ads/active/?limit=${limit}`);
  if (Array.isArray(res)) return res;
  return (res as any).results ?? (res as any).data ?? [];
};

/** Public: record a click on an ad */
export const clickAd = async (campaignId: string) =>
  apiPost<{ success: boolean }>(`/ads/active/${campaignId}/click/`, { body: {} });

/** Admin: list all campaigns */
export const adminGetAllAds = async (params?: { status?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.status) q.append('status', params.status);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  return apiGet<{ results: Ad[]; count: number }>(`/admin/ads/?${q.toString()}`);
};

/** Admin: create a new campaign */
export const adminCreateAd = async (payload: Partial<Ad> & { title: string }) =>
  apiPost<Ad>('/admin/ads/', { body: payload });

/** Admin: update a campaign */
export const adminUpdateAd = async (id: string, payload: Partial<Ad>) =>
  apiPatch<Ad>(`/admin/ads/${id}/`, { body: payload });

/** Admin: delete a campaign */
export const adminDeleteAd = async (id: string) =>
  apiDelete<{ success: boolean }>(`/admin/ads/${id}/`);
