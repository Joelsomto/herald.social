import { apiGet, apiPost, apiPatch, apiDelete } from '../apiClient';

export type AdCampaign = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  budget_points: number;
  spent_points: number;
  impressions: number;
  clicks: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type AdCampaignsResponse = {
  data: AdCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

/** List the current user's ad campaigns */
export const getMyAdCampaigns = async () => {
  return apiGet<AdCampaign[] | AdCampaignsResponse>('/ads/campaigns/me/');
};

/** Create a new ad campaign */
export const createAdCampaign = async (payload: {
  title: string;
  description?: string;
  budget_points: number;
  start_date?: string;
  end_date?: string;
}) => {
  return apiPost<AdCampaign>('/ads/campaigns/', { body: payload });
};

/** Update an ad campaign (e.g., change status) */
export const updateAdCampaign = async (campaignId: string, payload: Partial<AdCampaign>) => {
  return apiPatch<AdCampaign>(`/ads/campaigns/${campaignId}/`, { body: payload });
};

/** Delete an ad campaign */
export const deleteAdCampaign = async (campaignId: string) => {
  return apiDelete<void>(`/ads/campaigns/${campaignId}/`);
};
