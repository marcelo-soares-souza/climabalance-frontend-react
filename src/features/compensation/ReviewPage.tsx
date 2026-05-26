import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { contributionsService } from "@/services/contributions";
import { useCompensationStore } from "@/stores/compensation-store";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ErrorBanner";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { formatTCO2e, formatCurrency } from "@/lib/format";
import { ArrowLeft, TreePine, MapPin } from "lucide-react";
import { mapCompensationApiError } from "./compensation-errors";

export function CompensationReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    areaId,
    currency,
    treesRequested: storedTreesRequested,
    setSelection,
  } = useCompensationStore();
  const [treesRequested, setTreesRequested] = useState(
    storedTreesRequested && storedTreesRequested > 0
      ? storedTreesRequested
      : 10,
  );
  const [error, setError] = useState<string | null>(null);

  const { data: area } = useQuery({
    queryKey: ["areas", areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const computedMaxTrees = (q: typeof quote) =>
    q?.remainingPurchasableTrees ?? 0;
  const computedEffective = (q: typeof quote) => {
    const m = computedMaxTrees(q);
    return m > 0 && treesRequested > m ? m : treesRequested;
  };

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["quote", areaId, treesRequested],
    queryFn: () =>
      contributionsService.getQuote({
        area_id: areaId!,
        trees_requested: treesRequested,
        currency,
      }),
    enabled: !!areaId && treesRequested > 0,
  });

  useEffect(() => {
    if (!areaId) navigate("/map");
  }, [areaId, navigate]);

  const handleProceed = () => {
    if (!quote || treesRequested < 1) {
      setError("compensation.error");
      return;
    }

    if (quote.remainingPurchasableTrees <= 0) {
      setError("compensation.tree_limit_exceeded");
      return;
    }

    setSelection({
      compensationMode: "tree_purchase",
      treesRequested,
      totalTCO2e: quote.estimatedTotalTCO2e,
      totalAmount: quote.totalAmount,
      currency: quote.currency,
    });
    navigate("/compensation/checkout");
  };

  if (!areaId) return null;

  const maxTrees = computedMaxTrees(quote);
  const effectiveTrees = computedEffective(quote);
  const limitReached = !!quote && quote.remainingPurchasableTrees <= 0;
  const canProceed =
    treesRequested > 0 && !!quote && !quoteLoading && !limitReached;

  return (
    <>
      <SEO title={t("seo.compensationReview.title")} />
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>
        <h1 className="text-2xl font-bold">{t("compensation.review.title")}</h1>

        {error && (
          <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />
        )}
        {!error && quoteError && (
          <ErrorBanner messageKey={mapCompensationApiError(quoteError)} />
        )}

        {/* Area Info */}
        {area && (
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {area.name}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {[area.city, area.state].filter(Boolean).join(", ")}
              </p>
              {area.pricePerTree != null && (
                <p className="text-sm mt-2">
                  {t("area.form.pricePerTree")}:{" "}
                  <span className="font-medium text-success">
                    {formatCurrency(area.pricePerTree, "USD")}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <TreePine className="h-5 w-5" />
              <p className="font-medium">
                {t("compensation.review.treePurchase")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="trees"
                type="number"
                min="1"
                max={maxTrees > 0 ? maxTrees : undefined}
                label={t("compensation.review.treesCount")}
                required
                value={effectiveTrees}
                onChange={(e) =>
                  setTreesRequested(parseInt(e.target.value) || 0)
                }
              />
              <InfoTooltip
                ariaLabel={t("compensation.review.treesCount")}
                content={<p>{t("tooltips.review.treesCount")}</p>}
              />
            </div>
            {quote && (
              <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {t("compensation.review.remainingTrees")}
                    <InfoTooltip
                      ariaLabel={t("compensation.review.remainingTrees")}
                      content={<p>{t("tooltips.review.remainingTrees")}</p>}
                    />
                  </span>
                  <span className="font-medium">
                    {quote.remainingPurchasableTrees}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {t("compensation.review.pricePerTree")}
                    <InfoTooltip
                      ariaLabel={t("compensation.review.pricePerTree")}
                      content={<p>{t("tooltips.review.pricePerTree")}</p>}
                    />
                  </span>
                  <span className="font-medium">
                    {formatCurrency(quote.pricePerTree, quote.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {t("compensation.review.estimatedCO2")}
                    <InfoTooltip
                      ariaLabel={t("compensation.review.estimatedCO2")}
                      content={<p>{t("tooltips.review.estimatedCO2")}</p>}
                    />
                  </span>
                  <span className="font-medium">
                    {formatTCO2e(quote.estimatedTotalTCO2e)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-primary-200 pt-2">
                  <span>{t("compensation.review.total")}</span>
                  <span className="text-primary">
                    {formatCurrency(quote.totalAmount, quote.currency)}
                  </span>
                </div>
                <p className="border-t border-primary-200 pt-3 text-xs leading-5 text-text-secondary">
                  {t("compensation.review.transferNotice")}
                </p>
                {limitReached && (
                  <p className="text-sm text-error font-medium">
                    {t("compensation.review.limitReached")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleProceed}
          disabled={!canProceed}
        >
          {t("compensation.review.proceed")}
        </Button>
      </div>
    </>
  );
}
