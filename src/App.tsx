import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense } from 'react';
import { router } from './router';
import { queryClient } from './config/query-client';
import { useAuthStore } from './stores/auth-store';
import { PageSkeleton } from './components/LoadingSkeleton';
import './config/i18n';

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    restoreSession();

    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [restoreSession, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageSkeleton />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  );
}
