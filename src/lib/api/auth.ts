import { apiGet, apiPost } from '../apiClient';
import type { ApiUser, AuthResponse, AuthSession } from './types';

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

export const authRefreshToken = async () => {
  return apiPost<AuthSession>('/auth/refresh/', { body: {} });
};

export const authChangePassword = async (payload: {
  old_password: string;
  new_password: string;
}) => {
  return apiPost<{ success: boolean; message: string }>('/auth/change-password/', { body: payload });
};

export const authGetSession = async () => {
  return apiGet<AuthSession>('/auth/session/');
};

export const authGetUser = async () => {
  return apiGet<ApiUser>('/auth/user/');
};

export const authGetCurrentUser = async () => {
  try {
    return await apiGet<ApiUser>('/auth/users/profiles/me/');
  } catch {
    return apiGet<ApiUser>('/auth/user/');
  }
};
