import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCountryName } from "@/lib/countries";
import { FileCheck, MapPin, Loader2 } from "lucide-react";
import { AreaThumbnail } from "@/components/AreaThumbnail";
import type { Area } from "@/types/area";

const PAGE_SIZE = 20;

export function PendingAreasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["areas", { status: "pending_audit" }],
      queryFn: ({ pageParam }) =>
        areasService.listAreasPaginated({
          status: "pending_audit",
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
        rootMargin: "200px",
      });
      observerRef.current.observe(node);
    },
    [handleIntersect],
  );

  return (
    <>
      <SEO title={t("seo.pendingAreas.title")} />
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t("audit.pending.title")}</h1>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-lg shadow-md animate-pulse p-4 space-y-3"
              >
                <div className="h-40 bg-gray-200 rounded-lg" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : allAreas.length > 0 ? (
          <div className="space-y-4">
            {allAreas.map((area: Area) => (
              <Card
                key={area.id}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => navigate(`/audit/area/${area.id}`)}
              >
                <AreaThumbnail
                  imageUrl={area.imageUrl}
                  thumbnailUrl={area.thumbnailUrl}
                  name={area.name}
                />
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">{area.name}</h3>
                    <StatusBadge status={area.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-text-secondary mb-1">
                    <MapPin className="h-3 w-3" />{" "}
                    {[
                      area.city,
                      area.state,
                      getCountryName(area.countryCode ?? ""),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {t("area.form.pricePerTree")}:{" "}
                      {area.pricePerTree != null
                        ? formatCurrency(area.pricePerTree, "USD")
                        : "-"}
                    </span>
                    <span className="text-text-secondary">
                      {formatDate(area.createdAt)}
                    </span>
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
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileCheck className="h-12 w-12" />}
                title={t("audit.pending.empty")}
                description={t("audit.pending.emptyDescription")}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
