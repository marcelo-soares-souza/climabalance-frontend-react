import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, formatKgCO2e } from '@/lib/format';
import { filterAreas, getAreaStatusOptions } from '@/features/map/lib/area-filters';
import { MapPin, Plus, FilterX } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AreaListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const canCreate = hasRole('producer') || isAdmin;
  const areaStatusOptions = getAreaStatusOptions(t, { includeAll: true, includeRejected: true });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', { status: statusFilter || 'all' }],
    queryFn: () => areasService.listAreas({ status: statusFilter || undefined }),
  });

  const filteredAreas = useMemo(() => {
    return filterAreas(areas, {
      search: searchFilter,
      city: cityFilter,
      state: stateFilter,
      status: statusFilter,
    });
  }, [areas, searchFilter, cityFilter, stateFilter, statusFilter]);

  const hasFilters = Boolean(searchFilter || cityFilter || stateFilter || statusFilter);

  const clearFilters = () => {
    setSearchFilter('');
    setCityFilter('');
    setStateFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('areas.list.title')}</h1>
        {canCreate && <Button onClick={() => navigate('/areas/create')} size="sm"><Plus className="h-4 w-4 mr-1" /> {t('areas.list.create')}</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          id="areas-search"
          label={t('areas.list.searchLabel')}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={t('areas.list.searchPlaceholder')}
        />
        <Input
          id="areas-city"
          label={t('area.form.city')}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder={t('areas.list.cityPlaceholder')}
        />
        <Input
          id="areas-state"
          label={t('area.form.state')}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          placeholder={t('areas.list.statePlaceholder')}
        />
        <Select
          id="areas-status"
          label={t('area.form.status')}
          options={areaStatusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>
      {hasFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterX className="h-4 w-4 mr-1" /> {t('areas.list.clearFilters')}
          </Button>
        </div>
      )}
      {isLoading ? <SkeletonList /> : filteredAreas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAreas.map((area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/areas/${area.id}`)}>
              <CardContent className="py-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold">{area.name}</h3>
                  <StatusBadge status={area.status} />
                </div>
                <div className="text-sm text-text-secondary flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {[area.city, area.state].filter(Boolean).join(', ') || '-'}
                </div>
                {area.biome && (
                  <p className="text-xs text-text-secondary">
                    {t('map.biome')}: {t(`map.biomes.${area.biome}`, area.biome)}
                  </p>
                )}
                {area.description && (
                  <p className="text-sm text-text-secondary">{area.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-primary-50 p-2">
                    <p className="text-xs text-text-secondary">{t('area.form.pricePerTree')}</p>
                    <p className="text-xs font-semibold text-primary">{area.pricePerTree != null ? formatCurrency(area.pricePerTree) : '-'}</p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2">
                    <p className="text-xs text-text-secondary">{t('area.tCO2ePerTree')}</p>
                    <p className="text-xs font-semibold text-amber-700">{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</p>
                  </div>
                  <div className="rounded-md bg-gray-100 p-2">
                    <p className="text-xs text-text-secondary">{t('area.form.defaultHorizonYears')}</p>
                    <p className="text-xs font-semibold text-text-primary">{area.defaultHorizonYears ?? 20} {t('common.years')}</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  {t('common.createdAt')}: {formatDate(area.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={<MapPin className="h-12 w-12" />} title={t('areas.list.empty')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}
