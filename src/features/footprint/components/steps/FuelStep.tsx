import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function FuelStep({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.fuel.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.fuel.description')}</p>
      <CategoryInputCard
        category="fuel"
        fields={[
          { key: 'gasoline', unit: 'L', labelKey: 'footprint.fuel.gasoline' },
          { key: 'ethanol', unit: 'L', labelKey: 'footprint.fuel.ethanol' },
          { key: 'diesel', unit: 'L', labelKey: 'footprint.fuel.diesel' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
