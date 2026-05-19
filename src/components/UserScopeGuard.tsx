import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { matchesPublicRef } from "@/lib/public-refs";

interface UserScopeGuardProps {
  children: React.ReactNode;
}

export function UserScopeGuard({ children }: UserScopeGuardProps) {
  const { userId, userSlug, isAdmin } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();

  if (!routeUserId) {
    return <Navigate to="/access-denied" replace />;
  }

  if (
    !isAdmin &&
    !matchesPublicRef(routeUserId, { id: userId, slug: userSlug })
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
