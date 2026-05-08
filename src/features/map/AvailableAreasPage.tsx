import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatKgCO2e } from '@/lib/format';
import { getCountryName } from '@/lib/countries';
import { getAreaDetailPath } from '@/lib/public-refs';
import { MapPin, TreePine, Plus, Loader2 } from 'lucide-react';
import { AreaThumbnail } from '@/components/AreaThumbnail';
import type { Area } from '@/types/area';

const PAGE_SIZE = 20;

export function AvailableAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();
  const canCreate = hasRole('producer') || isAdmin;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['areas', 'available', { status: 'active' }],
    queryFn: ({ pageParam }) =>
      areasService.listAreasPaginated({
        onlyActive: true,
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
        <h1 className="text-2xl font-bold">{t('areas.available.title')}</h1>
        {canCreate && <Button onClick={() => navigate('/areas/create')} size="sm"><Plus className="h-4 w-4 mr-1" /> {t('areas.list.create')}</Button>}
      </div>
      {isLoading ? (
        <AreaCardsSkeleton />
      ) : allAreas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAreas.map((area: Area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => navigate(getAreaDetailPath(area))}>
              <AreaThumbnail imageUrl={area.imageUrl} thumbnailUrl={area.thumbnailUrl} name={area.name} />
              <CardContent className="p-5 h-full flex flex-col gap-3">
                <h3 className="font-bold leading-snug">{area.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[area.city, area.state, getCountryName(area.countryCode ?? '')].filter(Boolean).join(', ') || '-'}</span>
                </div>
                <div className="flex-1 min-h-0">
                  {area.description && (
                    <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">{area.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-primary-50 p-3">
                    <p className="text-xs text-text-secondary mb-0.5">{t('area.form.pricePerTree')}</p>
                    <p className="text-sm font-bold text-primary">{area.pricePerTree != null ? formatCurrency(area.pricePerTree) : '-'}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-text-secondary mb-0.5">{t('area.tCO2ePerTree')}</p>
                    <p className="text-sm font-bold text-amber-700">{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</p>
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
      ) : <EmptyState icon={<TreePine className="h-12 w-12" />} title={t('areas.available.empty')} description={t('areas.available.emptyHint')} action={canCreate ? <Button onClick={() => navigate('/areas/create')}>{t('areas.list.create')}</Button> : undefined} />}
    </div>
  );
}

function AreaCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-lg shadow-md animate-pulse">
          <div className="h-40 bg-gray-200 rounded-t-lg" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-gray-200 rounded-lg" />
              <div className="h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
