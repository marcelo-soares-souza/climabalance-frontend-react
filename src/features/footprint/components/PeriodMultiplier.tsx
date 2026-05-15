import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { CalendarDays, CalendarRange, Clock } from 'lucide-react';

const PERIOD_MULTIPLIERS_MAP: Record<string, number> = {
  year: 1,
  month: 12,
  week: 52,
};

export const PERIOD_MULTIPLIERS: Record<string, number> = PERIOD_MULTIPLIERS_MAP;

interface Props {
  period: string;
  onChange: (period: string) => void;
}

const PERIODS = [
  { key: 'year', icon: CalendarRange },
  { key: 'month', icon: CalendarDays },
  { key: 'week', icon: Clock },
];

export function PeriodMultiplier({ period, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-sm font-medium text-text-secondary mb-2">
        {t('footprint.periodMultiplier.label')}
      </p>
      <div className="flex gap-2">
        {PERIODS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-sm border transition-all',
              period === key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'border-gray-200 hover:border-primary hover:bg-primary-50',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`footprint.periodMultiplier.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
