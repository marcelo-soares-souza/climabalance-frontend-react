import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation } from "@tanstack/react-query";
import { footprintService } from "@/services/footprint";
import { queryClient } from "@/config/query-client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { StatusBadge } from "@/components/StatusBadge";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { ResultBreakdownChart } from "./components/ResultBreakdownChart";
import { RegisteredInputsCard } from "./components/RegisteredInputsCard";
import { formatTCO2e, formatDate } from "@/lib/format";
import { ArrowLeft, TreePine, CheckCircle, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/use-auth";
import { getUserCalculationEditPath } from "@/lib/public-refs";

export function CalculationDetailPage() {
  const { id, userId: routeUserId } = useParams<{
    id: string;
    userId: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId: currentUserId, userSlug, isAdmin } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: calculation, isLoading } = useQuery({
    queryKey: ["calculations", id],
    queryFn: () => footprintService.getCalculation(id!),
    enabled: !!id,
  });

  const finalizeMutation = useMutation({
    mutationFn: () => footprintService.finalizeCalculation(id!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calculations", id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => footprintService.deleteCalculation(id!),
    onSuccess: () => {
      navigate("/footprint/history");
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!calculation) return <div>{t("common.notFound")}</div>;
  const canEditDraft =
    calculation.status === "draft" &&
    (isAdmin ||
      (calculation.userId != null && calculation.userId === currentUserId));
  const editPath = getUserCalculationEditPath(
    calculation.id,
    routeUserId
      ? { id: calculation.userId ?? routeUserId, slug: routeUserId }
      : calculation.userId === currentUserId
        ? { id: currentUserId, slug: userSlug }
        : calculation.userId
          ? { id: calculation.userId }
          : undefined,
  );

  return (
    <>
      <SEO title={t("seo.calculationDetail.title")} />
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {t(`footprint.profile.${calculation.profileType}`)}
              </h1>
              <InfoTooltip
                ariaLabel={t("tooltips.footprint.profileTypeAria")}
                content={<p>{t("tooltips.footprint.profileType")}</p>}
              />
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              {formatDate(calculation.periodStart)} -{" "}
              {formatDate(calculation.periodEnd)}{" "}
              <InfoTooltip
                ariaLabel={t("tooltips.footprint.periodAria")}
                content={<p>{t("tooltips.footprint.period")}</p>}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={calculation.status} />
            <InfoTooltip
              ariaLabel={t("tooltips.footprint.calculationStatusAria")}
              panelClassName="left-auto right-0"
              content={
                <>
                  <p>
                    <strong className="text-text-primary">
                      {t("common.status.draft")}:
                    </strong>{" "}
                    {t("tooltips.footprint.statusDraft")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.finalized")}:
                    </strong>{" "}
                    {t("tooltips.footprint.statusFinalized")}
                  </p>
                </>
              }
            />
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary to-primary-light text-white">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm opacity-80">
              {t("footprint.result.totalEmissions")}{" "}
              <InfoTooltip
                ariaLabel={t("tooltips.footprint.totalEmissionsAria")}
                content={<p>{t("tooltips.footprint.totalEmissions")}</p>}
              />
            </div>
            <p className="text-4xl font-bold">
              {formatTCO2e(calculation.totalTCO2e)}
            </p>
          </CardContent>
        </Card>

        {calculation.breakdown && calculation.breakdown.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="font-medium mb-4">
                {t("footprint.result.breakdown")}
              </h3>
              <ResultBreakdownChart breakdown={calculation.breakdown} />
            </CardContent>
          </Card>
        )}

        {calculation.inputs && calculation.inputs.length > 0 && (
          <RegisteredInputsCard inputs={calculation.inputs} />
        )}

        <div className="flex gap-3">
          {canEditDraft && (
            <>
              <Button variant="outline" onClick={() => navigate(editPath)}>
                <Edit className="h-4 w-4 mr-2" /> {t("common.edit")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => finalizeMutation.mutate()}
                loading={finalizeMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />{" "}
                {t("footprint.result.finalize")}
              </Button>
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> {t("common.delete")}
              </Button>
            </>
          )}
          {calculation.status !== "draft" && (
            <Button
              onClick={() =>
                navigate(
                  `/map?calculationId=${encodeURIComponent(calculation.id)}&tCO2e=${encodeURIComponent(calculation.totalTCO2e)}`,
                )
              }
            >
              <TreePine className="h-4 w-4 mr-2" />{" "}
              {t("footprint.result.compensate")}
            </Button>
          )}
        </div>

        <ConfirmDialog
          open={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
          title={t("footprint.detail.deleteTitle")}
          message={t("footprint.detail.deleteMessage")}
          danger
          loading={deleteMutation.isPending}
        />
      </div>
    </>
  );
}
