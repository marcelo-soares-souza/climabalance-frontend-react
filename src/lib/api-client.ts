import { API_BASE, REQUEST_TIMEOUT } from "@/config/api";
import { tokenStorage } from "./token-storage";
import { csrfToken } from "./csrf-token";
import { isTokenExpired } from "./jwt";
import { ensureSessionCsrfToken } from "./session-bootstrap";
import i18n from "@/config/i18n";

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const existingSignal = options.signal;
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort(existingSignal.reason);
    });
  }

  const signal = existingSignal
    ? anySignal([existingSignal, controller.signal])
    : controller.signal;

  return fetch(url, { ...options, signal }).finally(() =>
    clearTimeout(timeoutId),
  );
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

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
    const currentCsrfToken = await ensureSessionCsrfToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (currentCsrfToken) {
      headers["x-csrf-token"] = currentCsrfToken;
    } else {
      return null;
    }
    const res = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({}),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data || json;
    tokenStorage.setAccessToken(data.accessToken);
    if (data.csrfToken) {
      csrfToken.set(data.csrfToken);
    }
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
  window.dispatchEvent(new CustomEvent("auth:logout"));
  return null;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
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
  "/auth/login",
  "/auth/register",
  "/auth/confirm-email",
  "/auth/password-reset",
  "/auth/human-check",
  "/auth/refresh",
];

function isAuthRoute(path: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => path.startsWith(route));
}

// Paths where a 401 response means the request itself is invalid
// (e.g. wrong old password) rather than the session being expired.
const NON_SESSION_401_PATHS = ["/users/change-password"];

function isNonSession401Path(path: string): boolean {
  return NON_SESSION_401_PATHS.some((route) => path.startsWith(route));
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);
  const shouldHandleSession = !isAuthRoute(path);

  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    "x-requested-by": "clm-balance",
    "Accept-Language": i18n.language,
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (shouldHandleSession && token && isTokenExpired(token)) {
    await handleUnauthorized();
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const currentCsrfToken = csrfToken.get();
  if (
    currentCsrfToken &&
    fetchOptions.method &&
    fetchOptions.method.toUpperCase() !== "GET"
  ) {
    headers["x-csrf-token"] = currentCsrfToken;
  }

  const res = await fetchWithTimeout(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && shouldHandleSession && !isNonSession401Path(path)) {
    const newToken = await handleUnauthorized();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const refreshedCsrfToken = csrfToken.get();
      if (
        refreshedCsrfToken &&
        fetchOptions.method &&
        fetchOptions.method.toUpperCase() !== "GET"
      ) {
        headers["x-csrf-token"] = refreshedCsrfToken;
      }
      const retryRes = await fetchWithTimeout(url, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(
          retryRes.status,
          err.error?.message_key || err.error || "request.failed",
          err.error?.details,
        );
      }
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json().then((j) => (j.data !== undefined ? j.data : j));
    }
    throw new ApiError(401, "auth.unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      err.error?.message_key || err.error || "request.failed",
      err.error?.details,
    );
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
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
    this.name = "ApiError";
    this.status = status;
    this.messageKey = messageKey;
    this.details = details;
  }
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const serialized =
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
    return request<T>(path, {
      ...options,
      method: "POST",
      body: serialized,
    });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
  async getBinary(path: string, options?: RequestOptions): Promise<Blob> {
    const { params, ...fetchOptions } = options || {};
    const url = buildUrl(path, params);
    const token = tokenStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetchWithTimeout(url, {
      ...fetchOptions,
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!res.ok) throw new ApiError(res.status, "download.failed");
    return res.blob();
  },
};
