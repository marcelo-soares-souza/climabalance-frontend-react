import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const {
    session,
    isAuthenticated,
    isAdmin,
    isLoading,
    hasRestoredSession,
    login,
    logout,
    hasRole,
  } = useAuthStore();
  return {
    session,
    isAuthenticated,
    isAdmin,
    isLoading,
    hasRestoredSession,
    login,
    logout,
    hasRole,
    userId: session?.userId ?? null,
    userSlug: session?.userSlug ?? null,
    roles: session?.roles ?? [],
  };
}
