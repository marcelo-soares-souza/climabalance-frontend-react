import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useInfiniteQuery } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatKgCO2e } from "@/lib/format";
import { getAreaStatusOptions } from "@/features/map/lib/area-filters";
import { countries, getCountryName } from "@/lib/countries";
import { getAreaDetailPath } from "@/lib/public-refs";
import { MapPin, TreePine, FilterX, Loader2 } from "lucide-react";
import { AreaThumbnail } from "@/components/AreaThumbnail";
import type { Area } from "@/types/area";

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));
const PAGE_SIZE = 20;

export function PublicAreasPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const statusOptions = getAreaStatusOptions(t, { includeAll: true });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["areas", "public", { status: statusFilter || "all" }],
      queryFn: ({ pageParam }) =>
        areasService.listAreasPaginated({
          ...(statusFilter ? { status: statusFilter } : {}),
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

  const filteredAreas = useMemo(() => {
    let result = allAreas;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q) ||
          (a.city ?? "").toLowerCase().includes(q) ||
          (a.state ?? "").toLowerCase().includes(q),
      );
    }
    if (countryFilter) {
      result = result.filter((a) => a.countryCode === countryFilter);
    }
    return result;
  }, [allAreas, searchFilter, countryFilter]);

  const hasFilters = Boolean(searchFilter || countryFilter || statusFilter);

  const clearFilters = () => {
    setSearchFilter("");
    setCountryFilter("");
    setStatusFilter("");
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
        rootMargin: "200px",
      });
      observerRef.current.observe(node);
    },
    [handleIntersect],
  );

  return (
    <>
      <SEO
        title={t("seo.publicAreas.title")}
        description={t("seo.publicAreas.description")}
      />
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("areas.public.title")}</h1>
          <p className="text-text-secondary mt-1">
            {t("areas.public.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input
            id="areas-public-search"
            label={t("areas.public.searchLabel")}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t("areas.public.searchPlaceholder")}
          />
          <Combobox
            id="areas-public-country"
            label={t("area.form.country")}
            value={countryFilter}
            options={countryOptions}
            emptyLabel={t("map.allCountries")}
            placeholder={t("area.form.selectCountry")}
            onChange={(val) => setCountryFilter(val)}
          />
          <Select
            id="areas-public-status"
            label={t("area.form.status")}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        {hasFilters && (
          <div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="h-4 w-4 mr-1" />{" "}
              {t("areas.list.clearFilters")}
            </Button>
          </div>
        )}

        {isLoading ? (
          <AreaCardsSkeleton />
        ) : filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAreas.map((area: Area) => (
              <Link
                key={area.id}
                to={getAreaDetailPath(area)}
                className="block h-full"
              >
                <Card className="h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
                  <AreaThumbnail
                    imageUrl={area.imageUrl}
                    thumbnailUrl={area.thumbnailUrl}
                    name={area.name}
                  />
                  <CardContent className="p-5 h-full flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-lg font-bold leading-snug">
                        {area.name}
                      </h3>
                      <StatusBadge status={area.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>
                        {[
                          area.city,
                          area.state,
                          getCountryName(area.countryCode ?? ""),
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      {area.description && (
                        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                          {area.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-primary-50 p-3">
                        <p className="text-xs text-text-secondary mb-0.5">
                          {t("area.form.pricePerTree")}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {area.pricePerTree != null
                            ? formatCurrency(area.pricePerTree, "USD")
                            : "-"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-xs text-text-secondary mb-0.5">
                          {t("area.tCO2ePerTree")}
                        </p>
                        <p className="text-sm font-bold text-amber-700">
                          {formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-100 p-3">
                        <p className="text-xs text-text-secondary mb-0.5">
                          {t("area.form.defaultHorizonYears")}
                        </p>
                        <p className="text-sm font-bold text-text-primary">
                          {area.defaultHorizonYears ?? 20} {t("common.years")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            <div ref={sentinelCallback} />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<TreePine className="h-12 w-12" />}
                title={t("areas.public.empty")}
                description={t("areas.public.emptyDescription")}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
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
