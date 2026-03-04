import { API_BASE_URL } from './apiConfig';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}


// Helper to get JWT token from localStorage or sessionStorage
function getAuthToken(): string | null {
  const raw = (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    null
  );

  if (!raw) return null;
  return raw.replace(/^Bearer\s+/i, '').trim();
}

const buildUrl = (path: string, params?: ApiRequestOptions['params']) => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(`${base}/${normalizedPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { method = 'GET', body, params, headers, signal } = options;

  const token = getAuthToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(headers || {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'string'
        ? payload
        : payload?.error?.message || response.statusText || 'Request failed';
    throw new ApiError(errorMessage, response.status, payload);
  }

  return payload as T;
};

export const apiGet = <T>(path: string, options: ApiRequestOptions = {}) =>
  apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T>(path: string, options: ApiRequestOptions = {}) =>
  apiRequest<T>(path, { ...options, method: 'POST' });

export const apiPatch = <T>(path: string, options: ApiRequestOptions = {}) =>
  apiRequest<T>(path, { ...options, method: 'PATCH' });

export const apiDelete = <T>(path: string, options: ApiRequestOptions = {}) =>
  apiRequest<T>(path, { ...options, method: 'DELETE' });
