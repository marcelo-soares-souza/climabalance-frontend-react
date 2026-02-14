import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function Scope3Step({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.scope3.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.scope3.description')}</p>
      <CategoryInputCard
        category="scope3"
        fields={[
          { key: 'business_travel', unit: 'tCO2e', labelKey: 'footprint.scope3.businessTravel' },
          { key: 'employee_commuting', unit: 'tCO2e', labelKey: 'footprint.scope3.employeeCommuting' },
          { key: 'purchased_goods', unit: 'tCO2e', labelKey: 'footprint.scope3.purchasedGoods' },
          { key: 'waste', unit: 'tCO2e', labelKey: 'footprint.scope3.waste' },
          { key: 'upstream_transport', unit: 'tCO2e', labelKey: 'footprint.scope3.upstreamTransport' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
