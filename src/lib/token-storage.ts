const STORAGE_KEY = "cb_access_token";

let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (accessToken) return accessToken;
    accessToken = localStorage.getItem(STORAGE_KEY);
    return accessToken;
  },
  setAccessToken(token: string): void {
    accessToken = token;
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* ignored - localStorage may not be available (SSR/privacy mode) */
    }
  },
  clear(): void {
    accessToken = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignored - localStorage may not be available (SSR/privacy mode) */
    }
  },
};
