import { apiGet, apiPost } from '../apiClient';
import type { Wallet } from './types';

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
};

export type TransactionsResponse = {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getCurrentUserWallet = async () => {
  return apiGet<Wallet>('/wallets/me/');
};

export const getUserWallet = async (userId: string) => {
  return apiGet<Wallet>(`/wallets/${userId}/`);
};

export const getWalletTransactions = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);

  const query = queryParams.toString();
  return apiGet<TransactionsResponse>(`/wallets/me/transactions/${query ? `?${query}` : ''}`);
};

export const convertPointsToTokens = async (payload: {
  amount: number;
}) => {
  return apiPost<{ success: boolean; new_points: number; new_tokens: number }>(
    '/wallets/me/convert/',
    { body: payload }
  );
};

export const transferWallet = async (payload: {
  recipient_id: string;
  amount: number;
  currency: 'httn_points' | 'httn_tokens';
}) => {
  return apiPost<{ success: boolean; message: string }>(
    '/wallets/transfer/',
    { body: payload }
  );
};
