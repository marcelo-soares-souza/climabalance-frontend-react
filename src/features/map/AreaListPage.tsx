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
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { filterAreas, getAreaStatusOptions } from '@/features/map/lib/area-filters';
import { getCountryName } from '@/lib/countries';
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
            <Card key={area.id} className="h-full cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/areas/${area.id}`)}>
              <CardContent className="p-5 flex flex-col gap-4 h-full">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-lg font-bold leading-snug">{area.name}</h3>
                  <StatusBadge status={area.status} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[area.city, area.state, getCountryName(area.countryCode ?? '')].filter(Boolean).join(', ') || '-'}</span>
                </div>
                <div className="flex-1 min-h-0">
                  {area.description && (
                    <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">{area.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-primary-50 p-3">
                    <p className="text-xs text-text-secondary mb-0.5">{t('area.form.pricePerTree')}</p>
                    <p className="text-sm font-bold text-primary">{area.pricePerTree != null ? formatCurrency(area.pricePerTree) : '-'}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-text-secondary mb-0.5">{t('area.tCO2ePerTree')}</p>
                    <p className="text-sm font-bold text-amber-700">{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-3">
                    <p className="text-xs text-text-secondary mb-0.5">{t('area.form.defaultHorizonYears')}</p>
                    <p className="text-sm font-bold text-text-primary">{area.defaultHorizonYears ?? 20} {t('common.years')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={<MapPin className="h-12 w-12" />} title={t('areas.list.empty')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}
