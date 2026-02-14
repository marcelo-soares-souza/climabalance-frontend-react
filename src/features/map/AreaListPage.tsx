import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatTCO2e } from '@/lib/format';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AreaListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [biomeFilter, setBiomeFilter] = useState('');

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', { status: statusFilter, biome: biomeFilter }],
    queryFn: () => areasService.listAreas({ status: statusFilter || undefined, biome: biomeFilter || undefined }),
  });

  const canCreate = hasRole('producer') || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('areas.list.title')}</h1>
        {canCreate && <Button onClick={() => navigate('/areas/create')} size="sm"><Plus className="h-4 w-4 mr-1" /> {t('areas.list.create')}</Button>}
      </div>
      <div className="flex gap-3">
        <Select options={[{ value: '', label: t('common.allStatuses') }, { value: 'draft', label: t('common.status.draft') }, { value: 'active', label: t('common.status.active') }, { value: 'pending', label: t('common.status.pending') }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Select options={[{ value: '', label: t('map.allBiomes') }, { value: 'amazonia', label: t('map.biomes.amazonia') }, { value: 'cerrado', label: t('map.biomes.cerrado') }]} value={biomeFilter} onChange={(e) => setBiomeFilter(e.target.value)} />
      </div>
      {isLoading ? <SkeletonList /> : areas && areas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/areas/${area.id}`)}>
              <CardContent className="py-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">{area.name}</h3>
                  <StatusBadge status={area.status} />
                </div>
                <div className="text-sm text-text-secondary flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" /> {[area.city, area.state].filter(Boolean).join(', ') || '-'}
                </div>
                <p className="text-sm">{t('area.totalCapacity')}: <span className="font-medium text-primary">{formatTCO2e(area.totalCapacityTCO2e)}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={<MapPin className="h-12 w-12" />} title={t('areas.list.empty')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}
