import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { footprintService } from '@/services/footprint';
import { usersService } from '@/services/users';
import { useAuth } from '@/hooks/use-auth';
import { CalculationCard } from './components/CalculationCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import {
  getUserCalculationPath,
  getUserNewCalculationPath,
  getUserPublicRef,
  matchesPublicRef,
} from '@/lib/public-refs';

export function HistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, userSlug, isAdmin } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const isSelf = !!targetUserId && matchesPublicRef(targetUserId, { id: userId, slug: userSlug });
  const requiresUserEmailFilter = !!routeUserId && !isSelf && isAdmin;
  const targetUserRef = getUserPublicRef(
    routeUserId
      ? { id: targetUserId, slug: routeUserId }
      : { id: userId, slug: userSlug },
  );
  const newCalculationPath = getUserNewCalculationPath(
    routeUserId ? { id: targetUserId, slug: targetUserRef } : { id: userId, slug: userSlug },
  );

  const { data: targetUser } = useQuery({
    queryKey: ['users', targetUserId],
    queryFn: () => usersService.getUser(targetUserId!),
    enabled: !!targetUserId && requiresUserEmailFilter,
  });

  const { data: calculations, isLoading } = useQuery({
    queryKey: ['calculations', { targetUserId, userEmail: targetUser?.email ?? null }],
    queryFn: () =>
      footprintService.listCalculations(
        requiresUserEmailFilter
          ? { user_email: targetUser?.email }
          : undefined
      ),
    enabled: !!targetUserId && (!requiresUserEmailFilter || !!targetUser?.email),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('footprint.history.title')}</h1>
        <Button onClick={() => navigate(newCalculationPath)} size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          {t('footprint.history.newCalculation')}
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : calculations && calculations.length > 0 ? (
        <div className="space-y-4">
          {calculations.map((calc) => (
            <CalculationCard
              key={calc.id}
              calculation={calc}
              detailsPath={getUserCalculationPath(
                calc.id,
                routeUserId
                  ? { id: targetUser?.id ?? targetUserId, slug: targetUser?.slug ?? targetUserRef }
                  : undefined,
              )}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Calculator className="h-12 w-12" />}
          title={t('footprint.history.empty')}
          description={t('footprint.history.emptyDescription')}
          action={<Button onClick={() => navigate(newCalculationPath)}>{t('footprint.history.startCalculation')}</Button>}
        />
      )}
    </div>
  );
}
