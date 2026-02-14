import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function Scope1Step({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.scope1.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.scope1.description')}</p>
      <CategoryInputCard
        category="scope1"
        fields={[
          { key: 'stationary_combustion', unit: 'tCO2e', labelKey: 'footprint.scope1.stationaryCombustion' },
          { key: 'mobile_combustion', unit: 'tCO2e', labelKey: 'footprint.scope1.mobileCombustion' },
          { key: 'fugitive_emissions', unit: 'tCO2e', labelKey: 'footprint.scope1.fugitiveEmissions' },
          { key: 'process_emissions', unit: 'tCO2e', labelKey: 'footprint.scope1.processEmissions' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
