import { apiGet, apiPost } from '../apiClient';

export type Cause = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_by: string;
  goal_amount: number;
  raised_amount: number;
  image_url?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  end_date?: string | null;
};

export type CausesResponse = {
  data: Cause[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getCauses = async (params?: { page?: number; limit?: number; sort?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return apiGet<CausesResponse>(`/causes${query ? `?${query}` : ''}`);
};

export const getCause = async (causeId: string) => {
  return apiGet<Cause>(`/causes/${causeId}`);
};

export const createCause = async (payload: {
  title: string;
  description: string;
  category: string;
  goal_amount: number;
  image_url?: string;
  end_date?: string;
}) => {
  return apiPost<Cause>('/causes', { body: payload });
};

export const donateToCause = async (causeId: string, payload: {
  amount: number;
  payment_type: 'wallet' | 'card' | 'crypto';
}) => {
  return apiPost<{ success: boolean; new_raised_amount: number }>(`/causes/${causeId}/donate`, { body: payload });
};
