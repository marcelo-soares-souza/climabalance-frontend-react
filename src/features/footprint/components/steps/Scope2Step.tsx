import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function Scope2Step({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.scope2.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.scope2.description')}</p>
      <CategoryInputCard
        category="scope2"
        fields={[
          { key: 'purchased_electricity', unit: 'kWh', labelKey: 'footprint.scope2.purchasedElectricity' },
          { key: 'purchased_heat', unit: 'kWh', labelKey: 'footprint.scope2.purchasedHeat' },
          { key: 'purchased_steam', unit: 'kWh', labelKey: 'footprint.scope2.purchasedSteam' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
