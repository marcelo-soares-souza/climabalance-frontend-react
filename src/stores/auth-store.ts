import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession } from '@/types/auth';
import { tokenStorage } from '@/lib/token-storage';
import { decodeToken, isTokenExpired } from '@/lib/jwt';
import { api } from '@/lib/api-client';
import { queryClient } from '@/config/query-client';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            accessToken: string;
            tokenType: string;
            expiresIn: number;
            refreshToken: string;
          }>('/auth/login', { email, password });

          tokenStorage.setAccessToken(data.accessToken);
          tokenStorage.setRefreshToken(data.refreshToken);

          const payload = decodeToken(data.accessToken);
          if (!payload) throw new Error('Invalid token');

          const session: AuthSession = {
            userId: payload.sub,
            email,
            roles: payload.roles,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: payload.exp * 1000,
          };

          set({
            session,
            isAuthenticated: true,
            isAdmin: payload.roles.includes('administrator'),
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        const rt = tokenStorage.getRefreshToken();
        if (rt) {
          api.post('/auth/revoke', { refresh_token: rt }).catch(() => {});
        }
        tokenStorage.clear();
        queryClient.clear();
        set({ session: null, isAuthenticated: false, isAdmin: false });
      },

      restoreSession: () => {
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        if (!accessToken || !refreshToken) return;

        if (isTokenExpired(accessToken)) {
          // will be handled by api-client interceptor on next request
          return;
        }

        const payload = decodeToken(accessToken);
        if (!payload) {
          tokenStorage.clear();
          return;
        }

        set({
          session: {
            userId: payload.sub,
            email: '',
            roles: payload.roles,
            accessToken,
            refreshToken,
            expiresAt: payload.exp * 1000,
          },
          isAuthenticated: true,
          isAdmin: payload.roles.includes('administrator'),
        });
      },

      hasRole: (role: string) => {
        const { session } = get();
        return session?.roles.includes(role) ?? false;
      },
    }),
    {
      name: 'cb_auth',
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => {
        return (state: AuthState | undefined) => {
          if (state?.session) {
            state.isAuthenticated = true;
            state.isAdmin = state.session.roles.includes('administrator');
          }
        };
      },
    },
  ),
);
