import { apiGet } from '../apiClient';
import type { Wallet } from './types';

export const getCurrentUserWallet = async () => {
  return apiGet<Wallet>('/wallets/me/');
};

export const getUserWallet = async (userId: string) => {
  return apiGet<Wallet>(`/wallets/${userId}`);
};
