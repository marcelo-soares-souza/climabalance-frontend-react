const ACCESS_TOKEN_KEY = 'cb_access_token';
const CSRF_TOKEN_KEY = 'cb_csrf_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getCsrfToken(): string | null {
    return localStorage.getItem(CSRF_TOKEN_KEY);
  },
  setCsrfToken(token: string): void {
    localStorage.setItem(CSRF_TOKEN_KEY, token);
  },
  clear(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(CSRF_TOKEN_KEY);
  },
};
