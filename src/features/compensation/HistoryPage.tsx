import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usersService } from "@/services/users";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatTCO2e, formatCurrency, formatDate } from "@/lib/format";
import { TreePine, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export function CompensationHistoryPage() {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const [offset, setOffset] = useState(0);

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["users", userId, "contributions", offset],
    queryFn: () =>
      usersService.getUserContributions(userId!, { limit: PAGE_SIZE, offset }),
    enabled: !!userId,
  });

  const hasMore = contributions?.length === PAGE_SIZE;
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <>
      <SEO title="Histórico de Compensações" />
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t("compensations.title")}</h1>

        {isLoading ? (
          <SkeletonList />
        ) : contributions && contributions.length > 0 ? (
          <>
            <div className="space-y-4">
              {contributions.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{c.areaName}</p>
                        <p className="text-sm text-text-secondary">
                          {t(`compensation.mode.${c.compensationMode}`)}
                        </p>
                        <p className="text-sm mt-1">
                          {formatTCO2e(c.totalTCO2e)} &middot; {c.treesCount}{" "}
                          {t("area.trees")}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={c.status} />
                        <p className="text-sm font-medium">
                          {formatCurrency(c.totalAmount, c.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {t("common.back")}
              </Button>
              <span className="text-sm text-text-secondary">
                {t("compensations.page", { page })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                disabled={!hasMore}
              >
                {t("common.next")} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<TreePine className="h-12 w-12" />}
            title={t("compensations.empty")}
            description={t("compensations.emptyDescription")}
          />
        )}
      </div>
    </>
  );
}
