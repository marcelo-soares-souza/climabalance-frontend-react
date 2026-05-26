import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StepIndicator } from "./components/StepIndicator";
import { ProfilePeriodStep } from "./components/steps/ProfilePeriodStep";
import { EnergyStep } from "./components/steps/EnergyStep";
import { TransportStep } from "./components/steps/TransportStep";
import { FuelStep } from "./components/steps/FuelStep";
import { FlightsStep } from "./components/steps/FlightsStep";
import { Scope1Step } from "./components/steps/Scope1Step";
import { Scope2Step } from "./components/steps/Scope2Step";
import { Scope3Step } from "./components/steps/Scope3Step";
import { ResultStep } from "./components/ResultStep";
import { useCalculator } from "./hooks/use-calculator";
import { footprintService } from "@/services/footprint";
import { queryClient } from "@/config/query-client";
import type { FootprintCalculation } from "@/types/footprint";
import { ApiError } from "@/lib/api-client";
import type { CreateCalculationRequest } from "@/types/footprint";
import { useAuth } from "@/hooks/use-auth";

export function CalculatorPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { id: routeCalculationId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const calculator = useCalculator();
  const { userId } = useAuth();
  const [result, setResult] = useState<FootprintCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastCalculatedSignatureRef = useRef<string | null>(null);
  const lastSubmittedSignatureRef = useRef<string | null>(null);
  const hydratedDraftIdRef = useRef<string | null>(null);
  const draftIdFromQuery = searchParams.get("draftId");
  const draftId = useMemo(() => {
    if (location.pathname.endsWith("/edit") && routeCalculationId) {
      return routeCalculationId;
    }
    return draftIdFromQuery;
  }, [draftIdFromQuery, location.pathname, routeCalculationId]);

  const { data: draftCalculation, isLoading: draftLoading } = useQuery({
    queryKey: ["calculations", draftId, "edit"],
    queryFn: () => footprintService.getCalculation(draftId!),
    enabled: !!draftId,
  });

  useEffect(() => {
    if (!draftId || !draftCalculation) return;
    if (hydratedDraftIdRef.current === draftId) return;
    calculator.hydrateFromDraft({
      profileType: draftCalculation.profileType,
      periodStart: draftCalculation.periodStart,
      periodEnd: draftCalculation.periodEnd,
      dataQuality: draftCalculation.dataQuality,
      inputs: draftCalculation.inputs,
    });
    lastCalculatedSignatureRef.current = JSON.stringify({
      profile_type: draftCalculation.profileType,
      period_start: draftCalculation.periodStart,
      period_end: draftCalculation.periodEnd,
      data_quality: draftCalculation.dataQuality,
      inputs: draftCalculation.inputs,
    });
    hydratedDraftIdRef.current = draftId;
  }, [calculator, draftCalculation, draftId]);

  const calculationPayload = useMemo<CreateCalculationRequest>(
    () => ({
      profile_type: calculator.state.profileType,
      period_start: calculator.state.periodStart,
      period_end: calculator.state.periodEnd,
      data_quality: calculator.state.dataQuality,
      inputs: calculator.state.inputs,
    }),
    [
      calculator.state.profileType,
      calculator.state.periodStart,
      calculator.state.periodEnd,
      calculator.state.dataQuality,
      calculator.state.inputs,
    ],
  );

  const calculationSignature = useMemo(
    () => JSON.stringify(calculationPayload),
    [calculationPayload],
  );

  const createMutation = useMutation({
    mutationFn: async (payload: CreateCalculationRequest) => {
      const result = await footprintService.createCalculation(payload);
      return footprintService.getCalculation(result.id);
    },
    onSuccess: (data, payload) => {
      setError(null);
      setResult(data);
      lastCalculatedSignatureRef.current = JSON.stringify(payload);
      lastSubmittedSignatureRef.current = JSON.stringify(payload);
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["users", userId, "climate-balance"],
        });
      }
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.messageKey
          : "footprint.error.createFailed",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: CreateCalculationRequest) => {
      if (!draftId) throw new Error("footprint.error.createFailed");
      await footprintService.updateCalculation(draftId, {
        period_start: payload.period_start,
        period_end: payload.period_end,
        data_quality: payload.data_quality,
        inputs: payload.inputs,
      });
      return footprintService.getCalculation(draftId);
    },
    onSuccess: (data, payload) => {
      setError(null);
      setResult(data);
      lastCalculatedSignatureRef.current = JSON.stringify(payload);
      lastSubmittedSignatureRef.current = JSON.stringify(payload);
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      queryClient.invalidateQueries({ queryKey: ["calculations", draftId] });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["users", userId, "climate-balance"],
        });
      }
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.messageKey
          : "footprint.error.createFailed",
      );
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => footprintService.finalizeCalculation(id),
    onSuccess: () => {
      setError(null);
      if (draftCalculation) {
        setResult({ ...draftCalculation, status: "finalized" });
      } else {
        setResult((prev) => (prev ? { ...prev, status: "finalized" } : prev));
      }
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["users", userId, "climate-balance"],
        });
      }
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.messageKey
          : "footprint.error.finalizeFailed",
      );
    },
  });
  const displayedResult = result ?? draftCalculation ?? null;

  // Auto-trigger calculation when entering result step
  useEffect(() => {
    const isPendingMutation = draftId
      ? updateMutation.isPending
      : createMutation.isPending;
    if (calculator.currentStep !== "result" || isPendingMutation) {
      return;
    }
    if (
      displayedResult &&
      lastCalculatedSignatureRef.current === calculationSignature
    ) {
      return;
    }
    if (lastSubmittedSignatureRef.current === calculationSignature) {
      return;
    }
    lastSubmittedSignatureRef.current = calculationSignature;
    if (draftId) {
      updateMutation.mutate(calculationPayload);
      return;
    }
    createMutation.mutate(calculationPayload);
  }, [
    calculator.currentStep,
    calculationPayload,
    calculationSignature,
    createMutation,
    draftId,
    displayedResult,
    updateMutation,
  ]);

  const handleNext = () => {
    if (isLastInputStep && calculator.state.inputs.length === 0) {
      setError("footprint.error.inputsRequired");
      return;
    }
    setError(null);
    calculator.nextStep();
  };
  const isLastInputStep =
    calculator.currentStepIndex === calculator.totalSteps - 2;
  const formattedPeriod = useMemo(() => {
    const start = new Date(calculator.state.periodStart);
    const end = new Date(calculator.state.periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${calculator.state.periodStart} - ${calculator.state.periodEnd}`;
    }
    const formatter = new Intl.DateTimeFormat(i18n.language, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }, [calculator.state.periodEnd, calculator.state.periodStart, i18n.language]);

  const renderStep = () => {
    if (calculator.currentStep === "result") {
      if (
        createMutation.isPending ||
        updateMutation.isPending ||
        draftLoading
      ) {
        return (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">{t("footprint.calculating")}</p>
          </div>
        );
      }
      if (displayedResult) {
        return (
          <ResultStep
            result={displayedResult}
            inputs={displayedResult?.inputs}
            onFinalize={() => finalizeMutation.mutate(displayedResult.id)}
            saving={finalizeMutation.isPending}
          />
        );
      }
      return null;
    }

    switch (calculator.currentStep) {
      case "profile":
        return (
          <ProfilePeriodStep
            profileType={calculator.state.profileType}
            periodStart={calculator.state.periodStart}
            periodEnd={calculator.state.periodEnd}
            dataQuality={calculator.state.dataQuality}
            onProfileTypeChange={calculator.setProfileType}
            onPeriodChange={calculator.setPeriod}
            onDataQualityChange={calculator.setDataQuality}
          />
        );
      case "energy":
        return (
          <EnergyStep
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("energy")}
          />
        );
      case "transport":
        return (
          <TransportStep
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("transport")}
          />
        );
      case "fuel":
        return (
          <FuelStep
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("fuel")}
          />
        );
      case "flights":
        return (
          <FlightsStep
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("flights")}
          />
        );
      case "scope1":
        return (
          <Scope1Step
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("scope1")}
          />
        );
      case "scope2":
        return (
          <Scope2Step
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("scope2")}
          />
        );
      case "scope3":
        return (
          <Scope3Step
            onSave={calculator.addInputs}
            initialValues={calculator.getInitialValues("scope3")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <SEO title={t("seo.calculator.title")} />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold font-display">
            {t("footprint.calculator.title")}
          </h1>
          <InfoTooltip
            content={<p>{t("footprint.calculator.methodologyTooltip")}</p>}
            ariaLabel={t("footprint.calculator.methodologyTooltip")}
          />
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium text-primary">
            {t("footprint.period.label")}
          </p>
          <p className="text-base font-semibold">{formattedPeriod}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Stepper column */}
          <div className="lg:w-56 shrink-0">
            <StepIndicator
              steps={calculator.steps}
              currentIndex={calculator.currentStepIndex}
              onStepClick={calculator.goToStep}
            />
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0 space-y-6">
            {error && (
              <ErrorBanner
                messageKey={error}
                onDismiss={() => setError(null)}
              />
            )}

            <Card>
              <CardContent className="py-6">{renderStep()}</CardContent>
            </Card>

            {calculator.currentStep !== "result" && (
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={calculator.prevStep}
                  disabled={calculator.isFirstStep}
                >
                  {t("common.back")}
                </Button>
                <Button onClick={handleNext}>
                  {isLastInputStep
                    ? t("footprint.calculator.calculate")
                    : t("common.next")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
