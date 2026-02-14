import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';
import type { CalculatorStep } from '../hooks/use-calculator';

interface StepIndicatorProps {
  steps: CalculatorStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

export function StepIndicator({ steps, currentIndex, onStepClick }: StepIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <button
            onClick={() => i < currentIndex && onStepClick?.(i)}
            disabled={i > currentIndex}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              i === currentIndex && 'bg-primary text-white',
              i < currentIndex && 'bg-primary-100 text-primary cursor-pointer hover:bg-primary-200',
              i > currentIndex && 'bg-gray-100 text-text-secondary',
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {i + 1}
            </span>
            {t(`footprint.steps.${step}`)}
          </button>
          {i < steps.length - 1 && <div className="w-4 h-px bg-gray-300 mx-1" />}
        </div>
      ))}
    </div>
  );
}
