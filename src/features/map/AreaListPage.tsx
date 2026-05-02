import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { getAreaStatusOptions } from '@/features/map/lib/area-filters';
import { getCountryName } from '@/lib/countries';
import { MapPin, Plus, FilterX, Loader2 } from 'lucide-react';
import { AreaThumbnail } from '@/components/AreaThumbnail';
import { useAuth } from '@/hooks/use-auth';
import type { Area } from '@/types/area';

const PAGE_SIZE = 20;

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['areas', 'list', { status: statusFilter || 'all' }],
    queryFn: ({ pageParam }) =>
      areasService.listAreasPaginated({
        ...(statusFilter ? { status: statusFilter } : {}),
        cursor: pageParam as string | undefined,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allAreas = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const filteredAreas = useMemo(() => {
    let result = allAreas;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q) ||
          (a.city ?? '').toLowerCase().includes(q) ||
          (a.state ?? '').toLowerCase().includes(q),
      );
    }
    if (cityFilter) {
      result = result.filter((a) => a.city?.toLowerCase() === cityFilter.toLowerCase());
    }
    if (stateFilter) {
      result = result.filter((a) => a.state?.toLowerCase() === stateFilter.toLowerCase());
    }
    return result;
  }, [allAreas, searchFilter, cityFilter, stateFilter]);

  const hasFilters = Boolean(searchFilter || cityFilter || stateFilter || statusFilter);

  const clearFilters = () => {
    setSearchFilter('');
    setCityFilter('');
    setStateFilter('');
    setStatusFilter('');
  };

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(handleIntersect, {
        rootMargin: '200px',
      });
      observerRef.current.observe(node);
    },
    [handleIntersect],
  );

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
      {isLoading ? (
        <AreaCardsSkeleton />
      ) : filteredAreas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAreas.map((area: Area) => (
            <Card
              key={area.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => navigate(`/areas/${area.id}`)}
            >
              <AreaThumbnail imageUrl={area.imageUrl} thumbnailUrl={area.thumbnailUrl} name={area.name} />
              <CardContent className="p-5 h-full flex flex-col gap-4">
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
          <div ref={sentinelCallback} />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : <EmptyState icon={<MapPin className="h-12 w-12" />} title={t('areas.list.empty')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}

function AreaCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-lg shadow-md animate-pulse">
          <div className="h-40 bg-gray-200 rounded-t-lg" />
          <div className="p-5 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 bg-gray-200 rounded-lg" />
              <div className="h-12 bg-gray-200 rounded-lg" />
              <div className="h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}