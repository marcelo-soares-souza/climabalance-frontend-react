import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { contributionsService } from "@/services/contributions";
import { paymentsService } from "@/services/payments";
import { stripeService } from "@/services/stripe";
import { useCompensationStore } from "@/stores/compensation-store";
import { queryClient } from "@/config/query-client";
import { VITE_STRIPE_PUBLISHABLE_KEY } from "@/config/stripe";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ErrorBanner } from "@/components/ErrorBanner";
import { formatCurrency, formatTCO2e } from "@/lib/format";
import { ArrowLeft, CreditCard } from "lucide-react";
import type { CompensationReportSummary } from "@/features/compensation/ReportPage";
import { mapCompensationApiError } from "./compensation-errors";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise() {
  if (!stripePromise && VITE_STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

type PaymentMethodTab = "card" | "pix";

type PaymentSuccessResult = {
  paymentId?: string;
  paymentIntentId?: string;
  amount?: number;
  compensationId?: string;
  paymentStatus?: string;
  qrCode?: string;
  copyPasteCode?: string;
  pending?: boolean;
  currency?: string;
};

function CardCheckoutForm({
  compensationId,
  ensureCompensationId,
  onSuccess,
  onError,
}: {
  compensationId: string | null;
  ensureCompensationId: () => Promise<string>;
  onSuccess: (result: PaymentSuccessResult) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError("checkout.cardElementMissing");
        return;
      }

      const resolvedCompensationId =
        compensationId ?? (await ensureCompensationId());
      const intent = await stripeService.createPaymentIntent({
        compensation_id: resolvedCompensationId,
        payment_method: "card",
      });

      if (!intent.clientSecret) {
        onError("payment.error");
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intent.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

      if (error) {
        onError(error.message || "payment.error");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const result = await paymentsService.getPaymentStatus(intent.paymentId);
        onSuccess(result);
      } else if (paymentIntent?.status === "requires_action") {
        onSuccess({
          pending: true,
          paymentId: intent.paymentId,
          paymentIntentId: intent.paymentIntentId,
        });
      } else {
        onSuccess({
          pending: true,
          paymentId: intent.paymentId,
          paymentIntentId: intent.paymentIntentId,
        });
      }
    } catch (err) {
      onError(mapCompensationApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1f2937",
                "::placeholder": { color: "#9ca3af" },
              },
            },
          }}
        />
      </div>
      <p className="text-xs text-text-secondary">
        {t("checkout.stripe_disclaimer")}
      </p>
      <p className="text-xs text-text-secondary">
        {t("checkout.testCardNote")}
      </p>
      <Button className="w-full" onClick={handleSubmit} loading={loading}>
        {t("checkout.pay")}
      </Button>
    </div>
  );
}

function PixCheckoutForm({
  compensationId,
  ensureCompensationId,
  onSuccess,
  onError,
}: {
  compensationId: string | null;
  ensureCompensationId: () => Promise<string>;
  onSuccess: (data: PaymentSuccessResult) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resolvedCompensationId =
        compensationId ?? (await ensureCompensationId());
      const intent = await stripeService.createPaymentIntent({
        compensation_id: resolvedCompensationId,
        payment_method: "pix",
      });

      onSuccess({
        paymentId: intent.paymentId,
        paymentIntentId: intent.paymentIntentId,
        qrCode: intent.qrCode,
        copyPasteCode: intent.copyPasteCode,
      });
    } catch (err) {
      onError(mapCompensationApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {t("checkout.paying_with_pix")}
      </p>
      <Button
        className="w-full"
        variant="outline"
        onClick={handleSubmit}
        loading={loading}
      >
        {t("checkout.switch_to_pix")}
      </Button>
    </div>
  );
}

export function CompensationCheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useCompensationStore();
  const [activeTab, setActiveTab] = useState<PaymentMethodTab>("card");
  const [error, setError] = useState<string | null>(null);
  const [compensationId, setCompensationId] = useState<string | null>(null);
  const summaryTotalAmount = store.totalAmount;
  const { data: checkoutQuote, error: checkoutQuoteError } = useQuery({
    queryKey: [
      "checkout-quote",
      store.areaId,
      store.treesRequested,
      store.currency,
    ],
    queryFn: () =>
      contributionsService.getQuote({
        area_id: store.areaId!,
        trees_requested: store.treesRequested!,
        currency: store.currency,
      }),
    enabled:
      !!store.areaId &&
      typeof store.treesRequested === "number" &&
      store.treesRequested > 0,
  });
  const producerReadyToReceiveSupport =
    checkoutQuote?.producerReadyToReceiveSupport ?? false;

  useEffect(() => {
    if (!store.areaId) {
      navigate("/map", { replace: true });
      return;
    }

    const hasTreesRequested =
      typeof store.treesRequested === "number" && store.treesRequested > 0;
    if (!hasTreesRequested || store.compensationMode !== "tree_purchase") {
      navigate("/compensation/review", { replace: true });
    }
  }, [navigate, store.areaId, store.compensationMode, store.treesRequested]);

  const createContributionMutation = useMutation({
    mutationFn: () =>
      contributionsService.createContribution({
        area_id: store.areaId!,
        calculation_id: store.calculationId || undefined,
        compensation_mode: "tree_purchase",
        total_t_co2e: store.totalTCO2e || undefined,
        trees_requested: store.treesRequested || undefined,
        total_amount: store.totalAmount || undefined,
        currency: store.currency,
      }),
  });

  const handlePaymentSuccess = (result: PaymentSuccessResult) => {
    queryClient.invalidateQueries({ queryKey: ["compensations"] });
    queryClient.invalidateQueries({ queryKey: ["contributions"] });
    queryClient.invalidateQueries({ queryKey: ["areas"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });

    if (result.pending && activeTab === "card") {
      navigate("/compensation/report", {
        state: {
          paymentResult: {
            paymentStatus: "pending",
            amount: summaryTotalAmount,
            currency: store.currency,
          },
          summary: {
            areaName: store.areaName,
            compensationMode: "tree_purchase",
            treesRequested: store.treesRequested,
            totalTCO2e: store.totalTCO2e,
            totalAmount: summaryTotalAmount,
            currency: store.currency,
            installments: 1,
          },
        },
      });
      return;
    }

    if (result.qrCode && activeTab === "pix") {
      navigate(`/payment/pix/${result.paymentId}`, {
        state: {
          qrCode: result.qrCode,
          copyPasteCode: result.copyPasteCode,
        },
      });
      return;
    }

    const reportSummary: CompensationReportSummary = {
      areaName: store.areaName,
      compensationMode: "tree_purchase",
      treesRequested: store.treesRequested,
      totalTCO2e: store.totalTCO2e,
      totalAmount: summaryTotalAmount ?? result.amount ?? 0,
      currency: store.currency,
      installments: 1,
    };

    navigate("/compensation/report", {
      state: {
        paymentResult: result,
        summary: reportSummary,
      },
    });
  };

  const ensureCompensationId = async (): Promise<string> => {
    if (compensationId) return compensationId;
    const contribution = await createContributionMutation.mutateAsync();
    setCompensationId(contribution.compensationId);
    return contribution.compensationId;
  };

  const stripePromise = getStripePromise();

  return (
    <>
      <SEO title={t("seo.checkout.title")} />
      <div className="max-w-lg mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>
        <h1 className="text-2xl font-bold">{t("checkout.title")}</h1>

        {error && (
          <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />
        )}
        {!error && checkoutQuoteError && (
          <ErrorBanner
            messageKey={mapCompensationApiError(checkoutQuoteError)}
          />
        )}
        {!error && checkoutQuote && !producerReadyToReceiveSupport && (
          <ErrorBanner messageKey="compensation.producer_not_onboarded" />
        )}

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">{t("checkout.summary")}</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("checkout.area")}</span>
              <span className="font-medium">{store.areaName}</span>
            </div>
            <div className="flex justify-between">
              <span className="inline-flex items-center gap-2">
                {t("checkout.mode")}
                <InfoTooltip
                  ariaLabel={t("tooltips.compensation.modeAria")}
                  content={<p>{t("tooltips.checkout.mode")}</p>}
                />
              </span>
              <span className="font-medium">
                {t("compensation.mode.tree_purchase")}
              </span>
            </div>
            {store.treesRequested != null && store.treesRequested > 0 && (
              <div className="flex justify-between">
                <span className="inline-flex items-center gap-2">
                  {t("checkout.trees")}
                  <InfoTooltip
                    ariaLabel={t("tooltips.checkout.treesAria")}
                    content={<p>{t("tooltips.checkout.trees")}</p>}
                  />
                </span>
                <span className="font-medium">{store.treesRequested}</span>
              </div>
            )}
            {store.totalTCO2e != null && store.totalTCO2e > 0 && (
              <div className="flex justify-between">
                <span className="inline-flex items-center gap-2">
                  {t("checkout.tco2e")}
                  <InfoTooltip
                    ariaLabel={t("tooltips.shared.tco2eAria")}
                    content={<p>{t("tooltips.shared.tco2e")}</p>}
                  />
                </span>
                <span className="font-medium">
                  {formatTCO2e(store.totalTCO2e)}
                </span>
              </div>
            )}
            {summaryTotalAmount != null && summaryTotalAmount > 0 && (
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="inline-flex items-center gap-2">
                  {t("checkout.total")}
                  <InfoTooltip
                    ariaLabel={t("tooltips.checkout.totalAria")}
                    content={<p>{t("tooltips.checkout.total")}</p>}
                  />
                </span>
                <span className="text-primary">
                  {formatCurrency(summaryTotalAmount, store.currency)}
                </span>
              </div>
            )}
            <p className="border-t pt-3 text-xs leading-5 text-text-secondary">
              {t("checkout.transferNotice")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate("/compensation/review")}
            >
              {t("common.edit")}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <h3 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />{" "}
              {t("checkout.payment_method_label")}
            </h3>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="card">
              <TabsList className="mb-4">
                <TabsTrigger value="card" onClick={() => setActiveTab("card")}>
                  {t("payment.method.credit_card")}
                </TabsTrigger>
                <TabsTrigger value="pix" onClick={() => setActiveTab("pix")}>
                  {t("payment.method.pix")}
                </TabsTrigger>
              </TabsList>
              {checkoutQuote && producerReadyToReceiveSupport ? (
                <>
                  <TabsContent value="card">
                    {stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <CardCheckoutForm
                          compensationId={compensationId}
                          ensureCompensationId={ensureCompensationId}
                          onSuccess={handlePaymentSuccess}
                          onError={setError}
                        />
                      </Elements>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm text-text-secondary">
                          {t("checkout.stripeNotConfigured")}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pix">
                    <PixCheckoutForm
                      compensationId={compensationId}
                      ensureCompensationId={ensureCompensationId}
                      onSuccess={handlePaymentSuccess}
                      onError={setError}
                    />
                  </TabsContent>
                </>
              ) : checkoutQuote ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-text-secondary">
                    {t("errors.compensation.producer_not_onboarded")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/compensation/review")}
                  >
                    {t("common.edit")}
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/compensation/review")}
                  >
                    {t("common.edit")}
                  </Button>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
