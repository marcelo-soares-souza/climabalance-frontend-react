import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function FlightsStep({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.flights.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.flights.description')}</p>
      <CategoryInputCard
        category="flights"
        fields={[
          { key: 'domestic_short', unit: 'km', labelKey: 'footprint.flights.domesticShort' },
          { key: 'domestic_long', unit: 'km', labelKey: 'footprint.flights.domesticLong' },
          { key: 'international', unit: 'km', labelKey: 'footprint.flights.international' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
