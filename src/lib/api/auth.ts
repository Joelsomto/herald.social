import { apiGet, apiPost } from '../apiClient';
import type { ApiUser, AuthResponse } from './types';

export const authSignUp = async (payload: {
  email: string;
  password: string;
  full_name?: string;
  username: string;
  display_name?: string;
}) => {
  return apiPost<AuthResponse>('/auth/signup/', { body: payload });
};


export const authSignIn = async (payload: { email: string; password: string }) => {
  return apiPost<AuthResponse>('/auth/signin/', { body: payload });
};

export const authSignOut = async () => {
  return apiPost<{ success?: boolean }>('/auth/signout/');
};


export const authGetCurrentUser = async () => {
  try {
    return await apiGet<ApiUser>('/auth/users/profiles/me/');
  } catch {
    return apiGet<ApiUser>('/auth/user/');
  }
};
