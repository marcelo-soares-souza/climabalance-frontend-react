import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTCO2e, formatDate } from '@/lib/format';
import type { CalculationResult } from '@/types/footprint';

export function CalculationCard({
  calculation,
  detailsPath,
}: {
  calculation: CalculationResult;
  detailsPath?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() =>
        navigate(
          detailsPath
            ? detailsPath
            : `/footprint/calculation/${calculation.id}`
        )
      }
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{t(`footprint.profile.${calculation.profileType}`)}</p>
            <p className="text-sm text-text-secondary">
              {formatDate(calculation.periodStart)} - {formatDate(calculation.periodEnd)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={calculation.status} />
            <InfoTooltip
              ariaLabel={t('tooltips.footprint.calculationStatusAria')}
              panelClassName="left-auto right-0"
              content={
                <>
                  <p><strong className="text-text-primary">{t('common.status.draft')}:</strong> {t('tooltips.footprint.statusDraft')}</p>
                  <p className="mt-2"><strong className="text-text-primary">{t('common.status.finalized')}:</strong> {t('tooltips.footprint.statusFinalized')}</p>
                </>
              }
            />
          </div>
        </div>
        <p className="text-xl font-bold text-primary">{formatTCO2e(calculation.totalTCO2e)}</p>
        <p className="text-xs text-text-secondary mt-1">{formatDate(calculation.createdAt)}</p>
      </CardContent>
    </Card>
  );
}
