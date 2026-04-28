import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { MapPin, TreePine, Plus } from 'lucide-react';

export function AvailableAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();
  const canCreate = hasRole('producer') || isAdmin;

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', 'available', { status: 'active' }],
    queryFn: () => areasService.listAreas({ status: 'active' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('areas.available.title')}</h1>
        {canCreate && <Button onClick={() => navigate('/areas/create')} size="sm"><Plus className="h-4 w-4 mr-1" /> {t('areas.list.create')}</Button>}
      </div>
      {isLoading ? <SkeletonList /> : areas && areas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/areas/${area.id}`)}>
              <CardContent className="py-4">
                <h3 className="font-medium mb-1">{area.name}</h3>
                <div className="flex items-center gap-1 text-sm text-text-secondary mb-2"><MapPin className="h-3 w-3" /> {[area.city, area.state].filter(Boolean).join(', ') || '-'}</div>
                <p className="text-sm">{t('area.form.pricePerTree')}: {area.pricePerTree != null ? formatCurrency(area.pricePerTree) : '-'}</p>
                <p className="text-sm text-text-secondary">{t('area.tCO2ePerTree')}: {formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={<TreePine className="h-12 w-12" />} title={t('areas.available.empty')} description={t('areas.available.emptyHint')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}
