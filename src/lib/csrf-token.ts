const STORAGE_KEY = "cb_csrf_token";

let token: string | null = null;

export const csrfToken = {
  get(): string | null {
    if (token) return token;
    token = localStorage.getItem(STORAGE_KEY);
    return token;
  },
  set(value: string): void {
    token = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignored - localStorage may not be available (SSR/privacy mode) */
    }
  },
  clear(): void {
    token = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignored - localStorage may not be available (SSR/privacy mode) */
    }
  },
};
