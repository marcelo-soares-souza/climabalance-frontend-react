import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatDate, formatTCO2e } from "@/lib/format";
import { certificatesService } from "@/services/certificates";
import { saveAs } from "file-saver";
import { ArrowLeft, Download, Receipt } from "lucide-react";
import { useCompensationStore } from "@/stores/compensation-store";
import type { PaymentResult } from "@/types/payment";
import type { CompensationMode } from "@/types/compensation";

export interface CompensationReportSummary {
  areaName: string | null;
  compensationMode: CompensationMode | null;
  treesRequested: number | null;
  totalTCO2e: number | null;
  totalAmount: number;
  currency: string;
}

export interface CompensationReportState {
  paymentResult: PaymentResult;
  summary: CompensationReportSummary;
}

export function CompensationReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompensationReportState | null;
  const paymentResult = state?.paymentResult;
  const summary = state?.summary;
  const [downloading, setDownloading] = useState(false);
  const store = useCompensationStore();

  useEffect(() => {
    if (!paymentResult) {
      navigate("/profile/contributions", { replace: true });
    }
  }, [navigate, paymentResult]);

  const hasReport = Boolean(paymentResult && summary);

  const clearedRef = useRef(false);
  useEffect(() => {
    if (hasReport && !clearedRef.current) {
      store.clearSelection();
      clearedRef.current = true;
    }
  }, [hasReport, store]);

  if (!hasReport) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            title={t("compensation.report.missingTitle")}
            description={t("compensation.report.missingDescription")}
            icon={<Receipt className="h-12 w-12" />}
            action={
              <Button onClick={() => navigate("/")}>
                {t("common.backToHome")}
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const safePaymentResult = paymentResult!;
  const safeSummary = summary!;
  const certificate = safePaymentResult.certificate ?? null;

  const compensationLabel = safeSummary.compensationMode
    ? t(`compensation.mode.${safeSummary.compensationMode}`)
    : "-";
  const formattedTrees =
    safeSummary.treesRequested != null ? safeSummary.treesRequested : "-";
  const formattedTCO2e =
    safeSummary.totalTCO2e != null ? formatTCO2e(safeSummary.totalTCO2e) : "-";
  const formattedAmount = formatCurrency(
    safeSummary.totalAmount,
    safeSummary.currency,
  );
  const handleDownload = async () => {
    if (!certificate?.id) return;
    setDownloading(true);
    try {
      const blob = await certificatesService.downloadCertificate(
        certificate.id,
      );
      saveAs(blob, `${certificate.certificateNumber}.pdf`);
    } catch {
      // ignore download errors for now
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <SEO title={t("seo.compensationReport.title")} />
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.backToHome")}
        </button>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            {t("compensation.report.subtitle")}
          </p>
          <h1 className="text-2xl font-bold">
            {t("compensation.report.title")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-medium">
              {t("compensation.report.summaryTitle")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{t("compensation.report.area")}</span>
              <span className="font-medium">{safeSummary.areaName ?? "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                {t("compensation.report.mode")}
                <InfoTooltip
                  ariaLabel={t("tooltips.compensation.modeAria")}
                  content={<p>{t("tooltips.checkout.mode")}</p>}
                />
              </span>
              <span className="font-medium">{compensationLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                {t("compensation.report.trees")}
                <InfoTooltip
                  ariaLabel={t("tooltips.checkout.treesAria")}
                  content={<p>{t("tooltips.checkout.trees")}</p>}
                />
              </span>
              <span className="font-medium">{formattedTrees}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                {t("compensation.report.tco2e")}
                <InfoTooltip
                  ariaLabel={t("tooltips.shared.tco2eAria")}
                  content={<p>{t("tooltips.shared.tco2e")}</p>}
                />
              </span>
              <span className="font-medium">{formattedTCO2e}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>{t("compensation.report.amount")}</span>
              <span className="text-primary">{formattedAmount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">
              {t("compensation.report.paymentTitle")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="inline-flex items-center gap-2">
                {t("compensation.report.statusLabel")}
                <InfoTooltip
                  ariaLabel={t("tooltips.compensation.paymentStatusAria")}
                  content={<p>{t("tooltips.compensation.paymentStatus")}</p>}
                />
              </span>
              <StatusBadge
                status={safePaymentResult.paymentStatus}
                tooltip={t(
                  `tooltips.status.payment.${safePaymentResult.paymentStatus}`,
                )}
              />
            </div>

            <div className="flex justify-between">
              <span>{t("compensation.report.processedAt")}</span>
              <span className="font-medium">
                {formatDate(safePaymentResult.processedAt)}
              </span>
            </div>
            {certificate && (
              <div className="flex justify-between">
                <span>{t("compensation.report.certificateStatus")}</span>
                <StatusBadge
                  status={certificate.status}
                  tooltip={t(
                    `tooltips.status.certificate.${certificate.status}`,
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">
              {t("compensation.report.certificateTitle")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-text-secondary">
              {t("compensation.report.certificateSubtitle")}
            </p>
            {certificate ? (
              <>
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-2">
                    {t("compensation.report.certificateNumber")}
                    <InfoTooltip
                      ariaLabel={t(
                        "tooltips.certificates.certificateNumberAria",
                      )}
                      content={
                        <p>{t("tooltips.certificates.certificateNumber")}</p>
                      }
                    />
                  </span>
                  <span className="font-medium">
                    {certificate.certificateNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("compensation.report.certificateIssued")}</span>
                  <span className="font-medium">
                    {formatDate(certificate.issuedAt)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />{" "}
                  {t("compensation.report.download")}
                </Button>
              </>
            ) : (
              <p className="text-text-secondary">
                {t("compensation.report.noCertificate")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/profile/certificates")}
          >
            {t("compensation.report.viewAll")}
          </Button>
          <Button className="flex-1" onClick={() => navigate("/")}>
            {t("common.backToHome")}
          </Button>
        </div>
      </div>
    </>
  );
}
