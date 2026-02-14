import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { session, isAuthenticated, isAdmin, isLoading, login, logout, hasRole } = useAuthStore();
  return {
    session,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    logout,
    hasRole,
    userId: session?.userId ?? null,
    roles: session?.roles ?? [],
  };
}
