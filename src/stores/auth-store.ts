import { create } from 'zustand';
import type { AuthSession } from '@/types/auth';
import { tokenStorage } from '@/lib/token-storage';
import { csrfToken } from '@/lib/csrf-token';
import { decodeToken, isTokenExpired } from '@/lib/jwt';
import { queryClient } from '@/config/query-client';
import { authService } from '@/services/auth';
import { usersService } from '@/services/users';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

function buildSession(accessToken: string, email = ''): AuthSession | null {
  const payload = decodeToken(accessToken);
  if (!payload) return null;

  return {
    userId: payload.sub,
    userSlug: null,
    email,
    roles: payload.roles,
    accessToken,
    expiresAt: payload.exp * 1000,
  };
}

async function hydrateSessionSlug(session: AuthSession): Promise<AuthSession> {
  try {
    const user = await usersService.getUser(session.userId);
    return {
      ...session,
      userSlug: user.slug || null,
    };
  } catch {
    return session;
  }
}

function clearAuthState() {
  tokenStorage.clear();
  queryClient.clear();
  return { session: null, isAuthenticated: false, isAdmin: false, isLoading: false };
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    session: null,
    isLoading: false,
    isAuthenticated: false,
    isAdmin: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const data = await authService.login(email, password);

        tokenStorage.setAccessToken(data.accessToken);
        csrfToken.set(data.csrfToken);

        const baseSession = buildSession(data.accessToken, email);
        const session = baseSession
          ? await hydrateSessionSlug(baseSession)
          : null;
        if (!session) throw new Error('Invalid token');

        const isAdmin = session.roles.includes('administrator');

        set({
          session,
          isAuthenticated: true,
          isAdmin,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    logout: () => {
      authService.revokeToken().catch(() => {});
      set(clearAuthState());
    },

    restoreSession: async () => {
      set({ isLoading: true });
      const accessToken = tokenStorage.getAccessToken();

      if (accessToken && !isTokenExpired(accessToken)) {
        const baseSession = buildSession(accessToken);
        const session = baseSession
          ? await hydrateSessionSlug(baseSession)
          : null;
        if (session) {
          set({
            session,
            isAuthenticated: true,
            isAdmin: session.roles.includes('administrator'),
            isLoading: false,
          });
          return;
        }
      }

      try {
        const data = await authService.refreshToken();
        tokenStorage.setAccessToken(data.accessToken);
        csrfToken.set(data.csrfToken);
        const baseSession = buildSession(data.accessToken);
        const session = baseSession
          ? await hydrateSessionSlug(baseSession)
          : null;
        if (!session) {
          set(clearAuthState());
          return;
        }

        set({
          session,
          isAuthenticated: true,
          isAdmin: session.roles.includes('administrator'),
          isLoading: false,
        });
      } catch {
        set(clearAuthState());
      }
    },

    hasRole: (role: string) => {
      const { session } = get();
      return session?.roles.includes(role) ?? false;
    },
  }),
);
