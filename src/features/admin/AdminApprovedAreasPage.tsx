import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { CheckCircle, ExternalLink } from "lucide-react";
import { getAreaDetailPath } from "@/lib/public-refs";

export function AdminApprovedAreasPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const { data: areas, isLoading } = useQuery({
    queryKey: ["admin-approved-areas"],
    queryFn: () => areasService.listAreas({ status: "approved", limit: 100 }),
  });

  const activateMutation = useMutation({
    mutationFn: (areaId: string) => areasService.activateArea(areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approved-areas"] });
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      setActivatingId(null);
    },
    onError: () => {
      setActivatingId(null);
    },
  });

  const handleActivate = (areaId: string) => {
    setActivatingId(areaId);
    activateMutation.mutate(areaId);
  };

  return (
    <>
      <SEO title={t("seo.adminApprovedAreas.title")} />
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t("admin.approvedAreas.title")}
          </h1>
          <p className="text-text-secondary mt-1">
            {t("admin.approvedAreas.description")}
          </p>
        </div>

        <Card>
          <CardContent className="px-0">
            {isLoading ? (
              <div className="px-6">
                <SkeletonTable rows={5} cols={4} />
              </div>
            ) : !areas || areas.length === 0 ? (
              <EmptyState
                title={t("admin.approvedAreas.empty")}
                description={t("admin.approvedAreas.emptyDescription")}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-sm font-medium text-text-secondary px-6 py-3">
                        {t("area.form.name")}
                      </th>
                      <th className="text-left text-sm font-medium text-text-secondary px-6 py-3">
                        {t("admin.approvedAreas.owner")}
                      </th>
                      <th className="text-left text-sm font-medium text-text-secondary px-6 py-3">
                        {t("admin.approvedAreas.approvedAt")}
                      </th>
                      <th className="text-right text-sm font-medium text-text-secondary px-6 py-3">
                        {t("admin.approvedAreas.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map((area) => (
                      <tr
                        key={area.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium">{area.name}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-text-secondary">
                            {area.ownerName || area.ownerEmail || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-text-secondary">
                            {area.updatedAt ? formatDate(area.updatedAt) : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={getAreaDetailPath(area)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-text-secondary hover:text-primary"
                              title={t("common.details")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleActivate(area.id)}
                              loading={activatingId === area.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t("area.actions.activate")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
