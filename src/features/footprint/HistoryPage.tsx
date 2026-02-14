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

export function HistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, isAdmin } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const isSelf = !!targetUserId && targetUserId === userId;
  const requiresUserEmailFilter = !!routeUserId && !isSelf && isAdmin;
  const detailsBasePath = routeUserId
    ? `/users/${routeUserId}/impact/calculations`
    : '/footprint/calculation';
  const newCalculationPath = routeUserId
    ? `/users/${routeUserId}/impact/calculations/new`
    : '/footprint/calculator';

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
              detailsBasePath={routeUserId ? detailsBasePath : undefined}
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
