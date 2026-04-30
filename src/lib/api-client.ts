import { API_BASE } from '@/config/api';
import { tokenStorage } from './token-storage';
import { isTokenExpired } from './jwt';

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

async function refreshTokenRequest(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data || json;
    tokenStorage.setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function handleUnauthorized(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      addRefreshSubscriber((token) => resolve(token));
    });
  }

  isRefreshing = true;
  const newToken = await refreshTokenRequest();
  isRefreshing = false;

  if (newToken) {
    onRefreshed(newToken);
    return newToken;
  }

  tokenStorage.clear();
  window.dispatchEvent(new CustomEvent('auth:logout'));
  return null;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

const PUBLIC_AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/confirm-email',
  '/auth/password-reset',
  '/auth/human-check',
  '/auth/refresh',
];

function isAuthRoute(path: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => path.startsWith(route));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);
  const shouldHandleSession = !isAuthRoute(path);

  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (shouldHandleSession && token && !isTokenExpired(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (shouldHandleSession && token) {
    const newToken = await handleUnauthorized();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
    }
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });

  if (res.status === 401 && shouldHandleSession) {
    const newToken = await handleUnauthorized();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(retryRes.status, err.error?.message_key || err.error || 'request.failed', err.error?.details);
      }
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json().then((j) => j.data !== undefined ? j.data : j);
    }
    throw new ApiError(401, 'auth.unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error?.message_key || err.error || 'request.failed', err.error?.details);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }

  return res.blob() as unknown as T;
}

export class ApiError extends Error {
  status: number;
  messageKey: string;
  details?: unknown;

  constructor(status: number, messageKey: string, details?: unknown) {
    super(messageKey);
    this.name = 'ApiError';
    this.status = status;
    this.messageKey = messageKey;
    this.details = details;
  }
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
  async getBinary(path: string, options?: RequestOptions): Promise<Blob> {
    const { params, ...fetchOptions } = options || {};
    const url = buildUrl(path, params);
    const token = tokenStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...fetchOptions, method: 'GET', headers, credentials: 'include' });
    if (!res.ok) throw new ApiError(res.status, 'download.failed');
    return res.blob();
  },
};
