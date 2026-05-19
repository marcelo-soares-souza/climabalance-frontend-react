import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation } from "@tanstack/react-query";
import { stripeService } from "@/services/stripe";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ApiError } from "@/lib/api-client";
import { Check, X, ExternalLink, Loader } from "lucide-react";

export function StripeSetupPage() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const returnedFromStripe = useMemo(
    () => new URLSearchParams(window.location.search).get("success") === "true",
    [],
  );

  const [isPolling, setIsPolling] = useState(returnedFromStripe);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (returnedFromStripe) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [returnedFromStripe]);

  const statusQuery = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => stripeService.getStripeOnboardingStatus(),
    refetchInterval: isPolling ? 3000 : false,
    retry: isPolling ? 15 : 3,
  });

  const hasAccount = statusQuery.data?.connected ?? false;
  const onboardingStatus = statusQuery.data?.onboarding_status ?? null;
  const isOnboardingComplete = onboardingStatus === "complete";
  const isPendingVerification = onboardingStatus === "pending_verification";

  useEffect(() => {
    if (!isPolling) return;
    if (isOnboardingComplete) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPolling(false);
      return;
    }
    pollTimeoutRef.current = setTimeout(() => {
      setIsPolling(false);
    }, 30000);
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [isPolling, isOnboardingComplete]);

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (!returnedFromStripe || !isOnboardingComplete) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSuccess(true);
  }, [returnedFromStripe, isOnboardingComplete]);

  const pollTimedOut =
    !isPolling && returnedFromStripe && !isOnboardingComplete;

  const onboardMutation = useMutation({
    mutationFn: () => stripeService.startStripeOnboarding(),
    onSuccess: (data) => {
      window.location.href = data.onboardingUrl;
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.messageKey : "producer.stripe.error",
      );
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: () => stripeService.getStripeDashboard(),
    onSuccess: (data) => {
      window.open(data.dashboardUrl, "_blank");
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.messageKey : "producer.stripe.error",
      );
    },
  });

  return (
    <>
      <SEO title="Configurar Stripe" />
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t("producer.stripe.title")}</h1>

        {error && (
          <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />
        )}

        {isPolling && !isOnboardingComplete && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Loader className="h-8 w-8 text-primary animate-spin mx-auto" />
              <p className="text-lg font-medium">
                {t("producer.stripe.onboarding_processing")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.onboarding_checking")}
              </p>
            </CardContent>
          </Card>
        )}

        {pollTimedOut && !isOnboardingComplete && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-text-secondary">
                {t("producer.stripe.onboarding_timeout")}
              </p>
            </CardContent>
          </Card>
        )}

        {isPendingVerification && !isPolling && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Loader className="h-6 w-6 text-primary animate-spin mx-auto" />
              <p className="font-medium">
                {t("producer.stripe.pending_verification")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.pending_verification_desc")}
              </p>
            </CardContent>
          </Card>
        )}

        {pollTimedOut && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-text-secondary">
                {t("producer.stripe.onboarding_timeout")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        {hasAccount && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">{t("producer.stripe.status")}</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>{t("producer.stripe.charges_enabled")}</span>
                <span className="flex items-center gap-1">
                  {statusQuery.data?.charges_enabled ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />{" "}
                      {t("producer.stripe.enabled")}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />{" "}
                      {t("producer.stripe.disabled")}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("producer.stripe.payouts_enabled")}</span>
                <span className="flex items-center gap-1">
                  {statusQuery.data?.payouts_enabled ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />{" "}
                      {t("producer.stripe.enabled")}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />{" "}
                      {t("producer.stripe.disabled")}
                    </>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasAccount && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-text-secondary">
                {t("producer.stripe.not_connected")}
              </p>
              <Button
                size="lg"
                onClick={() => onboardMutation.mutate()}
                loading={onboardMutation.isPending}
              >
                {t("producer.stripe.connect_now")}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasAccount && onboardingStatus === "incomplete" && !isPolling && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-text-secondary">
                {t("producer.stripe.onboarding_incomplete_desc")}
              </p>
              <Button
                size="lg"
                onClick={() => onboardMutation.mutate()}
                loading={onboardMutation.isPending}
              >
                {t("producer.stripe.continue_onboarding")}
              </Button>
            </CardContent>
          </Card>
        )}

        {isOnboardingComplete && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 justify-center text-green-600 mb-2">
                <Check className="h-5 w-5" />
                <span className="font-medium">
                  {showSuccess
                    ? t("producer.stripe.onboarding_complete")
                    : t("producer.stripe.enabled")}
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => dashboardMutation.mutate()}
                loading={dashboardMutation.isPending}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("producer.stripe.dashboard")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">
              {t("producer.stripe.onboarding_title")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{t("producer.stripe.what_is")}</p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.what_is_desc")}
              </p>
            </div>
            <div>
              <p className="font-medium">
                {t("producer.stripe.prerequisites")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.prerequisites_desc")}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="font-medium">{t("producer.stripe.step1")}</p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.step1_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">{t("producer.stripe.step2")}</p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.step2_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">{t("producer.stripe.step3")}</p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.step3_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">{t("producer.stripe.step4")}</p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.step4_desc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">{t("producer.stripe.faq")}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm">
                {t("producer.stripe.faq_q1")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.faq_a1")}
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">
                {t("producer.stripe.faq_q2")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.faq_a2")}
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">
                {t("producer.stripe.faq_q3")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("producer.stripe.faq_a3")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
