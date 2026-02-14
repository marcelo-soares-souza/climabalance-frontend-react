import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Leaf, Calculator, TreePine, Award } from 'lucide-react';

const ONBOARDING_KEY = 'cb_onboarding_done';

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    { icon: <Leaf className="h-16 w-16" />, title: t('onboarding.step1.title'), description: t('onboarding.step1.description') },
    { icon: <Calculator className="h-16 w-16" />, title: t('onboarding.step2.title'), description: t('onboarding.step2.description') },
    { icon: <TreePine className="h-16 w-16" />, title: t('onboarding.step3.title'), description: t('onboarding.step3.description') },
    { icon: <Award className="h-16 w-16" />, title: t('onboarding.step4.title'), description: t('onboarding.step4.description') },
  ];

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="text-primary mb-6">{steps[step].icon}</div>
      <h1 className="text-2xl font-bold mb-4">{steps[step].title}</h1>
      <p className="text-text-secondary mb-8">{steps[step].description}</p>
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex gap-4 justify-center">
        {step < steps.length - 1 ? (
          <>
            <Button variant="ghost" onClick={finish}>{t('onboarding.skip')}</Button>
            <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
          </>
        ) : (
          <Button onClick={finish}>{t('onboarding.finish')}</Button>
        )}
      </div>
    </div>
  );
}
