import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { filterAreas } from '@/features/map/lib/area-filters';
import { getAreaStatusOptions } from '@/features/map/lib/area-filters';
import { countries, getCountryName } from '@/lib/countries';
import { MapPin, TreePine, FilterX } from 'lucide-react';

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));

export function PublicAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const statusOptions = getAreaStatusOptions(t, { includeAll: true });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', 'public', { status: statusFilter || 'all' }],
    queryFn: () => areasService.getMapAreas(statusFilter ? { status: statusFilter } : undefined),
  });

  const filteredAreas = useMemo(() => {
    return filterAreas(areas, {
      search: searchFilter,
      country: countryFilter,
      status: statusFilter,
    });
  }, [areas, searchFilter, countryFilter, statusFilter]);

  const hasFilters = Boolean(searchFilter || countryFilter || statusFilter);

  const clearFilters = () => {
    setSearchFilter('');
    setCountryFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('areas.public.title')}</h1>
        <p className="text-text-secondary mt-1">{t('areas.public.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input
          id="areas-public-search"
          label={t('areas.public.searchLabel')}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={t('areas.public.searchPlaceholder')}
        />
        <Combobox
          id="areas-public-country"
          label={t('area.form.country')}
          value={countryFilter}
          options={countryOptions}
          emptyLabel={t('map.allCountries')}
          placeholder={t('area.form.selectCountry')}
          onChange={(val) => setCountryFilter(val)}
        />
        <Select
          id="areas-public-status"
          label={t('area.form.status')}
          options={statusOptions}
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
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{[area.city, area.state, getCountryName(area.countryCode ?? '')].filter(Boolean).join(', ') || '-'}</span>
                </div>
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
