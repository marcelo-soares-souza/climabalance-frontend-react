import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface UserScopeGuardProps {
  children: React.ReactNode;
}

export function UserScopeGuard({ children }: UserScopeGuardProps) {
  const { userId, isAdmin } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();

  if (!routeUserId) {
    return <Navigate to="/access-denied" replace />;
  }

  if (!isAdmin && routeUserId !== userId) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
