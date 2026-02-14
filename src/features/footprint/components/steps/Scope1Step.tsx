import { useTranslation } from 'react-i18next';
import { Factory, Info } from 'lucide-react';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function Scope1Step({ onSave, initialValues }: { onSave: (inputs: FootprintInput[], category: FootprintInput['category']) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Factory className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{t('footprint.scope1.title')}</h3>
          <p className="text-base text-text-secondary">{t('footprint.scope1.description')}</p>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-base font-medium text-primary">{t('footprint.scope1.whatIsTitle')}</p>
          <p className="text-base text-text-secondary mt-1">{t('footprint.scope1.whatIsDescription')}</p>
        </div>
      </div>

      <CategoryInputCard
        category="scope1"
        fields={[
          { key: 'stationary_combustion', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope1.stationaryCombustion', metadata: { activity_subtype: 'scope1_stationary_combustion' } },
          { key: 'mobile_combustion', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope1.mobileCombustion', metadata: { activity_subtype: 'scope1_mobile_combustion' } },
          { key: 'fugitive_emissions', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope1.fugitiveEmissions', metadata: { activity_subtype: 'scope1_fugitive_emissions' } },
          { key: 'process_emissions', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope1.processEmissions', metadata: { activity_subtype: 'scope1_process_emissions' } },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
