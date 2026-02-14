import { useTranslation } from 'react-i18next';
import { Fuel, Info } from 'lucide-react';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function FuelStep({ onSave, initialValues }: { onSave: (inputs: FootprintInput[], category: FootprintInput['category']) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Fuel className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{t('footprint.fuel.title')}</h3>
          <p className="text-base text-text-secondary">{t('footprint.fuel.description')}</p>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-base text-text-secondary">{t('footprint.fuel.tip')}</p>
      </div>

      <CategoryInputCard
        category="fuel"
        fields={[
          { key: 'gasoline', unit: 'liter', displayUnit: 'L', labelKey: 'footprint.fuel.gasoline', metadata: { fuel_type: 'gasoline' } },
          { key: 'ethanol', unit: 'liter', displayUnit: 'L', labelKey: 'footprint.fuel.ethanol', metadata: { fuel_type: 'ethanol' } },
          { key: 'diesel', unit: 'liter', displayUnit: 'L', labelKey: 'footprint.fuel.diesel', metadata: { fuel_type: 'diesel' } },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
