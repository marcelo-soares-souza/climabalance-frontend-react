import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCalculator } from './hooks/use-calculator';
import { StepIndicator } from './components/StepIndicator';
import { ResultStep } from './components/ResultStep';
import { ProfilePeriodStep } from './components/steps/ProfilePeriodStep';
import { EnergyStep } from './components/steps/EnergyStep';
import { TransportStep } from './components/steps/TransportStep';
import { FuelStep } from './components/steps/FuelStep';
import { FlightsStep } from './components/steps/FlightsStep';
import { Scope1Step } from './components/steps/Scope1Step';
import { Scope2Step } from './components/steps/Scope2Step';
import { Scope3Step } from './components/steps/Scope3Step';
import { footprintService } from '@/services/footprint';
import { useAuth } from '@/hooks/use-auth';
import { LogIn } from 'lucide-react';
import type { CalculationResult } from '@/types/footprint';
import type { DraftSnapshot } from './hooks/use-calculator';

const GUEST_STORAGE_KEY = 'climabalance_guest_calc';

function saveGuestCalc(data: { state: DraftSnapshot; result: CalculationResult }) {
  sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
}

function loadGuestCalc(): { state: DraftSnapshot; result: CalculationResult } | null {
  const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(GUEST_STORAGE_KEY);
    return null;
  }
}

function clearGuestCalc() {
  sessionStorage.removeItem(GUEST_STORAGE_KEY);
}

export function GuestCalculatorPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const calculator = useCalculator();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [didRestore, setDidRestore] = useState(false);

  // Initialize result from saved session data
  const [result, setResult] = useState<CalculationResult | null>(() => {
    const saved = loadGuestCalc();
    if (isAuthenticated && saved) {
      setDidRestore(true);
      return saved.result;
    }
    return null;
  });

  // Restore calculator state after login redirect
  useEffect(() => {
    if (didRestore) {
      const saved = loadGuestCalc();
      if (saved) {
        calculator.hydrateFromDraft(saved.state, true);
        clearGuestCalc();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didRestore]);

  const isLastInputStep = calculator.currentStepIndex === calculator.totalSteps - 2;
  const formattedPeriod = useMemo(() => {
    const start = new Date(calculator.state.periodStart);
    const end = new Date(calculator.state.periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${calculator.state.periodStart} - ${calculator.state.periodEnd}`;
    }
    const formatter = new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }, [calculator.state.periodEnd, calculator.state.periodStart, i18n.language]);
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
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndCompensate = async () => {
    if (!result) return;

    if (!isAuthenticated) {
      saveGuestCalc({
        state: {
          profileType: calculator.state.profileType,
          periodStart: calculator.state.periodStart,
          periodEnd: calculator.state.periodEnd,
          dataQuality: calculator.state.dataQuality,
          inputs: calculator.state.inputs,
        },
        result,
      });
      navigate('/login', { state: { from: '/calculator' } });
      return;
    }

    // Authenticated: create calculation → finalize → navigate to compensation
    setSaving(true);
    try {
      const created = await footprintService.createCalculation({
        profile_type: calculator.state.profileType,
        period_start: calculator.state.periodStart,
        period_end: calculator.state.periodEnd,
        data_quality: calculator.state.dataQuality,
        inputs: calculator.state.inputs,
      });
      await footprintService.finalizeCalculation(created.id);
      clearGuestCalc();
      navigate('/compensation/review', {
        state: {
          calculationId: created.id,
          totalTCO2e: result.totalTCO2e,
        },
      });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">{t('footprint.calculating')}</p>
        </div>
      );
    }

    if (result && calculator.currentStep === 'result') {
      return (
        <div className="space-y-6">
          <ResultStep result={result} showCompensateAction={false} />
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <LogIn className="h-6 w-6 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">
                  {isAuthenticated ? t('footprint.guest.returnTitle') : t('footprint.guest.saveTitle')}
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  {isAuthenticated ? t('footprint.guest.returnPrompt') : t('footprint.guest.savePrompt')}
                </p>
              </div>
            </div>
            <div className="flex">
              <Button onClick={handleSaveAndCompensate} loading={saving} className="flex-1">
                {t('footprint.guest.saveAndCompensate')}
              </Button>
            </div>
          </div>
        </div>
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
      case 'energy':
        return <EnergyStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('energy')} />;
      case 'transport':
        return <TransportStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('transport')} />;
      case 'fuel':
        return <FuelStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('fuel')} />;
      case 'flights':
        return <FlightsStep onSave={calculator.addInputs} initialValues={calculator.getInitialValues('flights')} />;
      case 'scope1':
        return <Scope1Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope1')} />;
      case 'scope2':
        return <Scope2Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope2')} />;
      case 'scope3':
        return <Scope3Step onSave={calculator.addInputs} initialValues={calculator.getInitialValues('scope3')} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">{t('footprint.guest.title')}</h1>
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm font-medium text-primary">{t('footprint.period.label')}</p>
        <p className="text-base font-semibold">{formattedPeriod}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <StepIndicator steps={calculator.steps} currentIndex={calculator.currentStepIndex} onStepClick={calculator.goToStep} />
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          <Card>
            <CardContent className="py-6">{renderStep()}</CardContent>
          </Card>

          {!(result && calculator.currentStep === 'result') && (
            <div className="flex justify-between">
              <Button variant="ghost" onClick={calculator.prevStep} disabled={calculator.isFirstStep}>
                {t('common.back')}
              </Button>
              <Button onClick={shouldCalculate ? handleCalculate : calculator.nextStep} loading={loading}>
                {shouldCalculate ? t('footprint.calculator.calculate') : t('common.next')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
