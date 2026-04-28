import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { filterAreas, getBiomeOptions } from '@/features/map/lib/area-filters';
import { MapPin, TreePine, FilterX } from 'lucide-react';

export function PublicAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [biomeFilter, setBiomeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const biomeOptions = getBiomeOptions(t, { includeAll: true });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', 'public', { biome: biomeFilter || 'all' }],
    queryFn: () => areasService.getMapAreas(biomeFilter ? { biome: biomeFilter } : undefined),
  });

  const filteredAreas = useMemo(() => {
    return filterAreas(areas, {
      search: searchFilter,
      city: cityFilter,
      state: stateFilter,
      status: 'active',
      biome: biomeFilter,
    });
  }, [areas, searchFilter, cityFilter, stateFilter, biomeFilter]);

  const hasFilters = Boolean(searchFilter || cityFilter || stateFilter || biomeFilter);

  const clearFilters = () => {
    setSearchFilter('');
    setCityFilter('');
    setStateFilter('');
    setBiomeFilter('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('areas.public.title')}</h1>
        <p className="text-text-secondary mt-1">{t('areas.public.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          id="areas-public-search"
          label={t('areas.public.searchLabel')}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={t('areas.public.searchPlaceholder')}
        />
        <Input
          id="areas-public-city"
          label={t('area.form.city')}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder={t('areas.list.cityPlaceholder')}
        />
        <Input
          id="areas-public-state"
          label={t('area.form.state')}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          placeholder={t('areas.list.statePlaceholder')}
        />
        <Input id="areas-public-status" label={t('area.form.status')} value={t('common.status.active')} disabled />
        <Select
          id="areas-public-biome"
          label={t('map.biome')}
          options={biomeOptions}
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

      {isLoading ? (
        <SkeletonList />
      ) : filteredAreas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAreas.map((area) => (
            <Card
              key={area.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/areas/${area.id}`)}
            >
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{area.name}</h3>
                  <StatusBadge status={area.status} />
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <MapPin className="h-3 w-3" />
                  <span>{[area.city, area.state].filter(Boolean).join(', ') || '-'}</span>
                </div>
                {area.biome && (
                  <p className="text-xs text-text-secondary">
                    {t('map.biome')}: {t(`map.biomes.${area.biome}`, area.biome)}
                  </p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TreePine className="h-12 w-12" />}
          title={t('areas.public.empty')}
          description={t('areas.public.emptyDescription')}
        />
      )}
    </div>
  );
}
