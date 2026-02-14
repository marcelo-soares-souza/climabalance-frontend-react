import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { footprintService } from '@/services/footprint';
import { CalculationCard } from './components/CalculationCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';

export function HistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: calculations, isLoading } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => footprintService.listCalculations(),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('footprint.history.title')}</h1>
        <Button onClick={() => navigate('/footprint/calculator')} size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          {t('footprint.history.newCalculation')}
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : calculations && calculations.length > 0 ? (
        <div className="space-y-4">
          {calculations.map((calc) => (
            <CalculationCard key={calc.id} calculation={calc} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Calculator className="h-12 w-12" />}
          title={t('footprint.history.empty')}
          description={t('footprint.history.emptyDescription')}
          action={<Button onClick={() => navigate('/footprint/calculator')}>{t('footprint.history.startCalculation')}</Button>}
        />
      )}
    </div>
  );
}
