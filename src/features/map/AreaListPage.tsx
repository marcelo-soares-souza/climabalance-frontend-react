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
import { formatDate, formatTCO2e } from '@/lib/format';
import { MapPin, Plus, FilterX } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AreaListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [biomeFilter, setBiomeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', { status: statusFilter, biome: biomeFilter }],
    queryFn: () => areasService.listAreas({ status: statusFilter || undefined, biome: biomeFilter || undefined }),
  });

  const filteredAreas = useMemo(() => {
    if (!areas) return [];

    const normalizedSearch = searchFilter.trim().toLowerCase();
    const normalizedCity = cityFilter.trim().toLowerCase();
    const normalizedState = stateFilter.trim().toLowerCase();

    return areas.filter((area) => {
      const name = area.name.toLowerCase();
      const city = (area.city ?? '').toLowerCase();
      const state = (area.state ?? '').toLowerCase();
      const biome = (area.biome ?? '').toLowerCase();
      const status = area.status;

      const matchesSearch = !normalizedSearch
        || name.includes(normalizedSearch)
        || city.includes(normalizedSearch)
        || state.includes(normalizedSearch)
        || biome.includes(normalizedSearch);
      const matchesCity = !normalizedCity || city.includes(normalizedCity);
      const matchesState = !normalizedState || state.includes(normalizedState);
      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesBiome = !biomeFilter || biome === biomeFilter;

      return matchesSearch && matchesCity && matchesState && matchesStatus && matchesBiome;
    });
  }, [areas, searchFilter, cityFilter, stateFilter, statusFilter, biomeFilter]);

  const canCreate = hasRole('producer') || isAdmin;
  const hasFilters = Boolean(searchFilter || cityFilter || stateFilter || statusFilter || biomeFilter);

  const clearFilters = () => {
    setSearchFilter('');
    setCityFilter('');
    setStateFilter('');
    setStatusFilter('');
    setBiomeFilter('');
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
          options={[
            { value: '', label: t('common.allStatuses') },
            { value: 'draft', label: t('common.status.draft') },
            { value: 'pending_audit', label: t('common.status.pending_audit') },
            { value: 'approved', label: t('common.status.approved') },
            { value: 'active', label: t('common.status.active') },
            { value: 'rejected', label: t('area.status.rejected') },
            { value: 'suspended', label: t('common.status.suspended') },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          id="areas-biome"
          label={t('map.biome')}
          options={[
            { value: '', label: t('map.allBiomes') },
            { value: 'amazonia', label: t('map.biomes.amazonia') },
            { value: 'cerrado', label: t('map.biomes.cerrado') },
            { value: 'mata_atlantica', label: t('map.biomes.mataAtlantica') },
            { value: 'caatinga', label: t('map.biomes.caatinga') },
            { value: 'pampa', label: t('map.biomes.pampa') },
            { value: 'pantanal', label: t('map.biomes.pantanal') },
          ]}
          value={biomeFilter}
          onChange={(e) => setBiomeFilter(e.target.value)}
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
                    <p className="text-xs text-text-secondary">{t('area.available')}</p>
                    <p className="text-xs font-semibold text-primary">{formatTCO2e(area.totalCapacityTCO2e - area.committedTCO2e)}</p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2">
                    <p className="text-xs text-text-secondary">{t('area.committed')}</p>
                    <p className="text-xs font-semibold text-amber-700">{formatTCO2e(area.committedTCO2e)}</p>
                  </div>
                  <div className="rounded-md bg-gray-100 p-2">
                    <p className="text-xs text-text-secondary">{t('area.totalCapacity')}</p>
                    <p className="text-xs font-semibold text-text-primary">{formatTCO2e(area.totalCapacityTCO2e)}</p>
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
