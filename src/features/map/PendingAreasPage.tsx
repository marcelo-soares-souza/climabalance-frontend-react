import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTCO2e, formatDate } from '@/lib/format';
import { FileCheck, MapPin } from 'lucide-react';

export function PendingAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', { status: 'pending' }],
    queryFn: () => areasService.listAreas({ status: 'pending' }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('audit.pending.title')}</h1>
      {isLoading ? <SkeletonList /> : areas && areas.length > 0 ? (
        <div className="space-y-4">
          {areas.map((area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/audit/area/${area.id}`)}>
              <CardContent className="py-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">{area.name}</h3>
                  <StatusBadge status={area.status} />
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary mb-1"><MapPin className="h-3 w-3" /> {[area.city, area.state].filter(Boolean).join(', ')}</div>
                <div className="flex justify-between text-sm">
                  <span>{t('area.totalCapacity')}: {formatTCO2e(area.totalCapacityTCO2e)}</span>
                  <span className="text-text-secondary">{formatDate(area.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={<FileCheck className="h-12 w-12" />} title={t('audit.pending.empty')} description={t('audit.pending.emptyDescription')} />}
    </div>
  );
}
