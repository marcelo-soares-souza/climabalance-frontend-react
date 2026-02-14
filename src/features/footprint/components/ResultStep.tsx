import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResultBreakdownChart } from './ResultBreakdownChart';
import { formatTCO2e, formatKgCO2e } from '@/lib/format';
import type { CalculationResult } from '@/types/footprint';
import { TreePine, BarChart3 } from 'lucide-react';

interface Props {
  result: CalculationResult;
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  saving?: boolean;
}

export function ResultStep({ result, onSaveDraft, onFinalize, saving }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const brazilAvg = 2.0;
  const globalAvg = 4.0;

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <Card className="bg-gradient-to-r from-primary to-primary-light text-white">
        <CardContent className="py-8 text-center">
          <p className="text-sm opacity-80 mb-2">{t('footprint.result.totalEmissions')}</p>
          <p className="text-4xl font-bold mb-1">{formatTCO2e(result.totalTCO2e)}</p>
          <p className="text-sm opacity-80">{formatKgCO2e(result.totalKgCO2e)}</p>
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card>
        <CardContent>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> {t('footprint.result.comparison')}
          </h3>
          <div className="space-y-3">
            <ComparisonBar label={t('footprint.result.you')} value={result.totalTCO2e} max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2} color="bg-primary" />
            <ComparisonBar label={t('footprint.result.brazilAvg')} value={brazilAvg} max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2} color="bg-amber-500" />
            <ComparisonBar label={t('footprint.result.globalAvg')} value={globalAvg} max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2} color="bg-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Chart */}
      {result.breakdown && result.breakdown.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-medium mb-4">{t('footprint.result.breakdown')}</h3>
            <ResultBreakdownChart breakdown={result.breakdown} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onSaveDraft && (
          <Button variant="outline" onClick={onSaveDraft} loading={saving} className="flex-1">
            {t('footprint.result.saveDraft')}
          </Button>
        )}
        {onFinalize && (
          <Button variant="secondary" onClick={onFinalize} loading={saving} className="flex-1">
            {t('footprint.result.finalize')}
          </Button>
        )}
        <Button onClick={() => navigate('/map')} className="flex-1">
          <TreePine className="h-4 w-4 mr-2" />
          {t('footprint.result.compensate')}
        </Button>
      </div>
    </div>
  );
}

function ComparisonBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{formatTCO2e(value)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
