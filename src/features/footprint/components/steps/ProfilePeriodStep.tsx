import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { ProfileType, DataQuality } from '@/types/footprint';

interface Props {
  profileType: ProfileType;
  periodStart: string;
  periodEnd: string;
  dataQuality: DataQuality;
  onProfileTypeChange: (type: ProfileType) => void;
  onPeriodChange: (start: string, end: string) => void;
  onDataQualityChange: (quality: DataQuality) => void;
}

export function ProfilePeriodStep({ profileType, periodStart, periodEnd, dataQuality, onProfileTypeChange, onPeriodChange, onDataQualityChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">{t('footprint.profile.typeLabel')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['individual', 'legal_entity'] as ProfileType[]).map((type) => (
            <Card
              key={type}
              className={cn('cursor-pointer transition-all', profileType === type ? 'ring-2 ring-primary' : 'hover:shadow-md')}
              onClick={() => onProfileTypeChange(type)}
            >
              <CardContent className="py-4 text-center">
                <p className="font-medium">{t(`footprint.profile.${type}`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input id="periodStart" type="date" label={t('footprint.period.start')} value={periodStart} onChange={(e) => onPeriodChange(e.target.value, periodEnd)} />
        <Input id="periodEnd" type="date" label={t('footprint.period.end')} value={periodEnd} onChange={(e) => onPeriodChange(periodStart, e.target.value)} />
      </div>

      <div>
        <h3 className="font-medium mb-3">{t('footprint.dataQuality.label')}</h3>
        <div className="flex gap-3">
          {(['real', 'estimated', 'standard'] as DataQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => onDataQualityChange(q)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm border transition-colors',
                dataQuality === q ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-primary',
              )}
            >
              {t(`footprint.dataQuality.${q}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
