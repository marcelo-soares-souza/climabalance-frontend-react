import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { PageSkeleton } from '@/components/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, hasRole, hasRestoredSession } = useAuth();
  const location = useLocation();

  if (!hasRestoredSession) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
