const DEFAULT_API_BASE_URL = 'https://herald-backend-6i3m.onrender.com/api/v1';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const API_BASE_URL = /\/api\/v1$/.test(rawBaseUrl)
  ? rawBaseUrl
  : `${rawBaseUrl}/api/v1`;
