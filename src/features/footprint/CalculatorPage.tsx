import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { StepIndicator } from './components/StepIndicator';
import { ProfilePeriodStep } from './components/steps/ProfilePeriodStep';
import { EnergyStep } from './components/steps/EnergyStep';
import { TransportStep } from './components/steps/TransportStep';
import { FuelStep } from './components/steps/FuelStep';
import { FlightsStep } from './components/steps/FlightsStep';
import { Scope1Step } from './components/steps/Scope1Step';
import { Scope2Step } from './components/steps/Scope2Step';
import { Scope3Step } from './components/steps/Scope3Step';
import { ResultStep } from './components/ResultStep';
import { useCalculator } from './hooks/use-calculator';
import { footprintService } from '@/services/footprint';
import { queryClient } from '@/config/query-client';
import type { CalculationResult } from '@/types/footprint';
import { ApiError } from '@/lib/api-client';

export function CalculatorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const calculator = useCalculator();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      footprintService.createCalculation({
        profile_type: calculator.state.profileType,
        period_start: calculator.state.periodStart,
        period_end: calculator.state.periodEnd,
        data_quality: calculator.state.dataQuality,
        inputs: calculator.state.inputs,
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.messageKey : 'footprint.error.createFailed');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => footprintService.finalizeCalculation(id),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
  });

  const handleNextFromResult = () => {
    if (!result) {
      createMutation.mutate();
    }
  };

  const handleNext = () => {
    if (calculator.isLastStep && !result) {
      createMutation.mutate();
    } else {
      calculator.nextStep();
    }
  };

  const renderStep = () => {
    if (result && calculator.currentStep === 'result') {
      return (
        <ResultStep
          result={result}
          onFinalize={() => finalizeMutation.mutate(result.id)}
          saving={finalizeMutation.isPending}
        />
      );
    }

    switch (calculator.currentStep) {
      case 'profile':
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
      case 'energy': return <EnergyStep onSave={calculator.addInputs} />;
      case 'transport': return <TransportStep onSave={calculator.addInputs} />;
      case 'fuel': return <FuelStep onSave={calculator.addInputs} />;
      case 'flights': return <FlightsStep onSave={calculator.addInputs} />;
      case 'scope1': return <Scope1Step onSave={calculator.addInputs} />;
      case 'scope2': return <Scope2Step onSave={calculator.addInputs} />;
      case 'scope3': return <Scope3Step onSave={calculator.addInputs} />;
      case 'result': return <div className="text-center py-8"><p>{t('footprint.calculating')}</p></div>;
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('footprint.calculator.title')}</h1>

      <StepIndicator
        steps={calculator.steps}
        currentIndex={calculator.currentStepIndex}
        onStepClick={calculator.goToStep}
      />

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      <Card>
        <CardContent className="py-6">
          {renderStep()}
        </CardContent>
      </Card>

      {!(result && calculator.currentStep === 'result') && (
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={calculator.prevStep}
            disabled={calculator.isFirstStep}
          >
            {t('common.back')}
          </Button>
          <Button
            onClick={handleNext}
            loading={createMutation.isPending}
          >
            {calculator.isLastStep ? t('footprint.calculator.calculate') : t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
