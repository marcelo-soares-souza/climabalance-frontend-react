import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCalculator } from './hooks/use-calculator';
import { StepIndicator } from './components/StepIndicator';
import { ProfilePeriodStep } from './components/steps/ProfilePeriodStep';
import { EnergyStep } from './components/steps/EnergyStep';
import { TransportStep } from './components/steps/TransportStep';
import { FuelStep } from './components/steps/FuelStep';
import { FlightsStep } from './components/steps/FlightsStep';
import { Scope1Step } from './components/steps/Scope1Step';
import { Scope2Step } from './components/steps/Scope2Step';
import { Scope3Step } from './components/steps/Scope3Step';
import { footprintService } from '@/services/footprint';
import { formatTCO2e } from '@/lib/format';
import type { CalculationResult } from '@/types/footprint';
import { Leaf } from 'lucide-react';

export function EmbedCalculatorPage() {
  const { t } = useTranslation();
  const calculator = useCalculator();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const isLastInputStep = calculator.currentStepIndex === calculator.totalSteps - 2;
  const shouldCalculate = isLastInputStep || (calculator.currentStep === 'result' && !result);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await footprintService.calculateGuest(
        calculator.state.profileType,
        calculator.state.periodStart,
        calculator.state.periodEnd,
        calculator.state.inputs,
        calculator.state.dataQuality
      );
      setResult(res);
      calculator.nextStep();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const renderStep = () => {
    if (result && calculator.currentStep === 'result') {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary mb-2">{t('footprint.result.totalEmissions')}</p>
          <p className="text-3xl font-bold text-primary mb-4">{formatTCO2e(result.totalTCO2e)}</p>
          <p className="text-sm text-text-secondary mb-6">{t('embed.registerPrompt')}</p>
          <Button onClick={() => window.open('/register', '_blank')}>{t('embed.register')}</Button>
        </div>
      );
    }
    switch (calculator.currentStep) {
      case 'profile': return <ProfilePeriodStep profileType={calculator.state.profileType} periodStart={calculator.state.periodStart} periodEnd={calculator.state.periodEnd} dataQuality={calculator.state.dataQuality} onProfileTypeChange={calculator.setProfileType} onPeriodChange={calculator.setPeriod} onDataQualityChange={calculator.setDataQuality} />;
      case 'energy': return <EnergyStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('energy')} />;
      case 'transport': return <TransportStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('transport')} />;
      case 'fuel': return <FuelStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('fuel')} />;
      case 'flights': return <FlightsStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('flights')} />;
      case 'scope1': return <Scope1Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope1')} />;
      case 'scope2': return <Scope2Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope2')} />;
      case 'scope3': return <Scope3Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope3')} />;
      default: return null;
    }
  };

  return (
    <>
      <SEO title={t('seo.embedCalculator.title')} description={t('seo.embedCalculator.description')} />
      <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">{t('app.name')}</span>
        </div>
        <StepIndicator steps={calculator.steps} currentIndex={calculator.currentStepIndex} />
        <Card className="mt-4">
          <CardContent className="py-6">{renderStep()}</CardContent>
        </Card>
        {!(result && calculator.currentStep === 'result') && (
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={calculator.prevStep} disabled={calculator.isFirstStep}>{t('common.back')}</Button>
            <Button onClick={shouldCalculate ? handleCalculate : calculator.nextStep} loading={loading}>
              {shouldCalculate ? t('footprint.calculator.calculate') : t('common.next')}
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
