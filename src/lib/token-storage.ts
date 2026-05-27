const KEY = "cb_access_token";
let fallback: string | null = null;

function hasStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (hasStorage()) {
      return localStorage.getItem(KEY);
    }
    return fallback;
  },
  setAccessToken(token: string): void {
    if (hasStorage()) {
      localStorage.setItem(KEY, token);
    }
    fallback = token;
  },
  clear(): void {
    if (hasStorage()) {
      localStorage.removeItem(KEY);
    }
    fallback = null;
  },
};
