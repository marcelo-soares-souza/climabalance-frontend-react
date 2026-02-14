import { useTranslation } from 'react-i18next';
import { CategoryInputCard } from '../CategoryInputCard';
import type { FootprintInput } from '@/types/footprint';

export function TransportStep({ onSave, initialValues }: { onSave: (inputs: FootprintInput[]) => void; initialValues?: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-medium mb-1">{t('footprint.transport.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('footprint.transport.description')}</p>
      <CategoryInputCard
        category="transport"
        fields={[
          { key: 'car', unit: 'km', labelKey: 'footprint.transport.car' },
          { key: 'bus', unit: 'km', labelKey: 'footprint.transport.bus' },
          { key: 'motorcycle', unit: 'km', labelKey: 'footprint.transport.motorcycle' },
          { key: 'train', unit: 'km', labelKey: 'footprint.transport.train' },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
