import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function EnergyStep({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.energy.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.energy.description')}</p>
      <CategoryInputCard
        category="energy"
        fields={[
          { key: 'electricity', unit: 'kWh', labelKey: 'footprint.energy.electricity' },
          { key: 'natural_gas', unit: 'm3', labelKey: 'footprint.energy.naturalGas' },
          { key: 'lpg', unit: 'kg', labelKey: 'footprint.energy.lpg' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
