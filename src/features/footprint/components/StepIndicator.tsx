import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';
import {
  User, Zap, Car, Fuel, Plane, Factory, Building, Truck, BarChart3, Check,
} from 'lucide-react';
import type { CalculatorStep } from '../hooks/use-calculator';

interface StepIndicatorProps {
  steps: CalculatorStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

const STEP_ICONS: Record<CalculatorStep, React.ReactNode> = {
  profile: <User className="h-4 w-4" />,
  energy: <Zap className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  fuel: <Fuel className="h-4 w-4" />,
  flights: <Plane className="h-4 w-4" />,
  scope1: <Factory className="h-4 w-4" />,
  scope2: <Building className="h-4 w-4" />,
  scope3: <Truck className="h-4 w-4" />,
  result: <BarChart3 className="h-4 w-4" />,
};

export function StepIndicator({ steps, currentIndex, onStepClick }: StepIndicatorProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop: vertical stepper */}
      <div className="hidden lg:flex flex-col gap-0">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step} className="flex items-start gap-3">
              {/* Circle + connector column */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isCompleted && onStepClick?.(i)}
                  disabled={isFuture}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                    isCompleted && 'bg-accent text-white cursor-pointer hover:bg-accent/80',
                    isCurrent && 'bg-primary text-white ring-4 ring-primary/20',
                    isFuture && 'bg-gray-200 text-gray-400',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : STEP_ICONS[step]}
                </button>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'w-0.5 h-8 my-1',
                    i < currentIndex ? 'bg-accent' : 'bg-gray-200',
                  )} />
                )}
              </div>
              {/* Label */}
              <div className="pt-2">
                <p className={cn(
                  'text-base leading-tight',
                  isCurrent && 'font-semibold text-primary',
                  isCompleted && 'text-text-secondary',
                  isFuture && 'text-gray-400',
                )}>
                  {t(`footprint.steps.${step}`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: horizontal compact stepper */}
      <div className="lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => isCompleted && onStepClick?.(i)}
                  disabled={isFuture}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                    isCurrent && 'bg-primary text-white',
                    isCompleted && 'bg-accent/15 text-accent cursor-pointer hover:bg-accent/25',
                    isFuture && 'bg-gray-100 text-text-secondary',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                  )}
                  {t(`footprint.steps.${step}`)}
                </button>
                {i < steps.length - 1 && <div className="w-4 h-px bg-gray-300 mx-1" />}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full mt-2">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
