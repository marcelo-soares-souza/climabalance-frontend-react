let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
  },
};
