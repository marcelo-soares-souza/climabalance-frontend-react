import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { compensationsService } from '@/services/compensations';
import { useCompensationStore } from '@/stores/compensation-store';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { formatTCO2e, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ArrowLeft, TreePine, Leaf, MapPin } from 'lucide-react';
import type { CompensationMode } from '@/types/compensation';

const PRICE_PER_TCO2E_BRL = 120;

export function CompensationReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { areaId, compensationMode, setSelection } = useCompensationStore();
  const [mode, setMode] = useState<CompensationMode>(compensationMode || 'tree_purchase');
  const [treesRequested, setTreesRequested] = useState(100);
  const [tco2eAmount, setTco2eAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: area } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', areaId, treesRequested],
    queryFn: () => compensationsService.getQuote({ area_id: areaId!, trees_requested: treesRequested, currency: 'BRL' }),
    enabled: !!areaId && mode === 'tree_purchase' && treesRequested > 0,
  });

  useEffect(() => {
    if (!areaId) navigate('/map');
  }, [areaId, navigate]);

  const handleProceed = () => {
    if (mode === 'tree_purchase') {
      setSelection({
        compensationMode: mode,
        treesRequested,
        totalTCO2e: quote?.estimatedTotalTCO2e || 0,
        totalAmount: quote?.totalAmount || 0,
      });
    } else {
      setSelection({
        compensationMode: mode,
        totalTCO2e: tco2eAmount,
        treesRequested: null,
        totalAmount: tco2eAmount * PRICE_PER_TCO2E_BRL,
      });
    }
    navigate('/compensation/checkout');
  };

  if (!areaId) return null;

  const available = area ? area.totalCapacityTCO2e - area.committedTCO2e : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('compensation.review.title')}</h1>

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      {/* Area Info */}
      {area && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {area.name}</h3>
            <p className="text-sm text-text-secondary mt-1">{[area.city, area.state].filter(Boolean).join(', ')}</p>
            <p className="text-sm mt-2">{t('area.available')}: <span className="font-medium text-success">{formatTCO2e(available)}</span></p>
          </CardContent>
        </Card>
      )}

      {/* Mode Selection */}
      <div>
        <h3 className="font-medium mb-3">{t('compensation.review.modeLabel')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={cn('cursor-pointer transition-all', mode === 'tree_purchase' ? 'ring-2 ring-primary' : 'hover:shadow-md')}
            onClick={() => setMode('tree_purchase')}
          >
            <CardContent className="py-4 text-center">
              <TreePine className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">{t('compensation.review.treePurchase')}</p>
              <p className="text-xs text-text-secondary">{t('compensation.review.treePurchaseDesc')}</p>
            </CardContent>
          </Card>
          <Card
            className={cn('cursor-pointer transition-all', mode === 'tco2e' ? 'ring-2 ring-primary' : 'hover:shadow-md')}
            onClick={() => setMode('tco2e')}
          >
            <CardContent className="py-4 text-center">
              <Leaf className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">{t('compensation.review.directTCO2e')}</p>
              <p className="text-xs text-text-secondary">{t('compensation.review.directTCO2eDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Amount Input */}
      <Card>
        <CardContent className="space-y-4">
          {mode === 'tree_purchase' ? (
            <>
              <Input
                id="trees"
                type="number"
                min="1"
                label={t('compensation.review.treesCount')}
                value={treesRequested}
                onChange={(e) => setTreesRequested(parseInt(e.target.value) || 0)}
              />
              {quote && (
                <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('compensation.review.pricePerTree')}</span>
                    <span className="font-medium">{formatCurrency(quote.pricePerTree)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('compensation.review.estimatedCO2')}</span>
                    <span className="font-medium">{formatTCO2e(quote.estimatedTotalTCO2e)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-primary-200 pt-2">
                    <span>{t('compensation.review.total')}</span>
                    <span className="text-primary">{formatCurrency(quote.totalAmount)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Input
              id="tco2e"
              type="number"
              min="0.01"
              step="0.01"
              label={t('compensation.review.tco2eAmount')}
              value={tco2eAmount}
              onChange={(e) => setTco2eAmount(parseFloat(e.target.value) || 0)}
            />
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handleProceed} disabled={quoteLoading}>
        {t('compensation.review.proceed')}
      </Button>
    </div>
  );
}
