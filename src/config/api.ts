export const API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${API_URL}/api/v1`;
export const REQUEST_TIMEOUT = 30000;

export function toApiUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_URL) return path;
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
