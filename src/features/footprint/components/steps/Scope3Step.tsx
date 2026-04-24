import { useTranslation } from 'react-i18next';
import { Truck, Info } from 'lucide-react';
import { CategoryInputCard } from '../CategoryInputCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import type { FootprintInput } from '@/types/footprint';

export function Scope3Step({ onSave, initialValues }: { onSave: (inputs: FootprintInput[], category: FootprintInput['category']) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{t('footprint.scope3.title')}</h3>
            <InfoTooltip ariaLabel={t('tooltips.footprint.scope3Aria')} content={<p>{t('tooltips.footprint.scope3')}</p>} />
          </div>
          <p className="text-base text-text-secondary">{t('footprint.scope3.description')}</p>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-base font-medium text-primary">{t('footprint.scope3.whatIsTitle')}</p>
          <p className="text-base text-text-secondary mt-1">{t('footprint.scope3.whatIsDescription')}</p>
        </div>
      </div>

      <CategoryInputCard
        category="scope3"
        fields={[
          { key: 'business_travel', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope3.businessTravel', metadata: { activity_subtype: 'scope3_business_travel' } },
          { key: 'employee_commuting', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope3.employeeCommuting', metadata: { activity_subtype: 'scope3_employee_commuting' } },
          { key: 'purchased_goods', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope3.purchasedGoods', metadata: { activity_subtype: 'scope3_purchased_goods' } },
          { key: 'waste', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope3.waste', metadata: { activity_subtype: 'scope3_waste' } },
          { key: 'upstream_transport', unit: 'tco2e', displayUnit: 'tCO2e', labelKey: 'footprint.scope3.upstreamTransport', metadata: { activity_subtype: 'scope3_upstream_transport' } },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
