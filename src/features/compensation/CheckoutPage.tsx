import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { contributionsService } from '@/services/contributions';
import { paymentsService } from '@/services/payments';
import { useCompensationStore } from '@/stores/compensation-store';
import { queryClient } from '@/config/query-client';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { formatCurrency, formatTCO2e } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import { ArrowLeft, CreditCard } from 'lucide-react';
import type { CompensationReportSummary } from '@/features/compensation/ReportPage';

export function CompensationCheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useCompensationStore();
  const [cardNumber, setCardNumber] = useState('4111111111111111');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('2027');
  const [cvv, setCvv] = useState('123');
  const [installments, setInstallments] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const summaryTotalAmount = store.totalAmount;

  useEffect(() => {
    if (!store.areaId) {
      navigate('/map', { replace: true });
      return;
    }

    const hasTreesRequested = typeof store.treesRequested === 'number' && store.treesRequested > 0;
    if (!hasTreesRequested || store.compensationMode !== 'tree_purchase') {
      navigate('/compensation/review', { replace: true });
    }
  }, [navigate, store.areaId, store.compensationMode, store.treesRequested]);

  const createContributionMutation = useMutation({
    mutationFn: () => contributionsService.createContribution({
      area_id: store.areaId!,
      calculation_id: store.calculationId || undefined,
      compensation_mode: 'tree_purchase',
      total_t_co2e: store.totalTCO2e || undefined,
      trees_requested: store.treesRequested || undefined,
      total_amount: store.totalAmount || undefined,
      currency: store.currency,
    }),
  });

  const payMutation = useMutation({
    mutationFn: (compensationId: string) => paymentsService.simulatePayment({
      compensation_id: compensationId,
      card_number: cardNumber,
      cardholder_name: cardholderName,
      expiration_month: parseInt(expiryMonth),
      expiration_year: parseInt(expiryYear),
      cvv,
      installments: parseInt(installments),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.messageKey : 'payment.error');
    },
  });

  const handlePay = async () => {
    setError(null);
    try {
      const contribution = await createContributionMutation.mutateAsync();
      const payment = await payMutation.mutateAsync(contribution.compensationId);
      const reportSummary: CompensationReportSummary = {
        areaName: store.areaName,
        compensationMode: 'tree_purchase',
        treesRequested: store.treesRequested,
        totalTCO2e: store.totalTCO2e,
        totalAmount: summaryTotalAmount || payment.amount,
        currency: store.currency,
        installments: payment.installments,
      };
      navigate('/compensation/report', {
        state: {
          paymentResult: payment,
          summary: reportSummary,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'compensation.error');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('checkout.title')}</h1>

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      {/* Order Summary */}
      <Card>
        <CardHeader><h3 className="font-medium">{t('checkout.summary')}</h3></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>{t('checkout.area')}</span><span className="font-medium">{store.areaName}</span></div>
          <div className="flex justify-between"><span className="inline-flex items-center gap-2">{t('checkout.mode')}<InfoTooltip ariaLabel={t('tooltips.compensation.modeAria')} content={<p>{t('tooltips.checkout.mode')}</p>} /></span><span className="font-medium">{t('compensation.mode.tree_purchase')}</span></div>
          {store.treesRequested != null && store.treesRequested > 0 && (
            <div className="flex justify-between"><span className="inline-flex items-center gap-2">{t('checkout.trees')}<InfoTooltip ariaLabel={t('tooltips.checkout.treesAria')} content={<p>{t('tooltips.checkout.trees')}</p>} /></span><span className="font-medium">{store.treesRequested}</span></div>
          )}
          {store.totalTCO2e != null && store.totalTCO2e > 0 && (
            <div className="flex justify-between"><span className="inline-flex items-center gap-2">{t('checkout.tco2e')}<InfoTooltip ariaLabel={t('tooltips.shared.tco2eAria')} content={<p>{t('tooltips.shared.tco2e')}</p>} /></span><span className="font-medium">{formatTCO2e(store.totalTCO2e)}</span></div>
          )}
          {summaryTotalAmount != null && summaryTotalAmount > 0 && (
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span className="inline-flex items-center gap-2">{t('checkout.total')}<InfoTooltip ariaLabel={t('tooltips.checkout.totalAria')} content={<p>{t('tooltips.checkout.total')}</p>} /></span>
              <span className="text-primary">{formatCurrency(summaryTotalAmount)}</span>
            </div>
          )}
          <p className="border-t pt-3 text-xs leading-5 text-text-secondary">
            {t('checkout.transferNotice')}
          </p>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/compensation/review')}>
            {t('common.edit')}
          </Button>
        </CardContent>
      </Card>

      {/* Card Form */}
      <Card>
        <CardHeader><h3 className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t('checkout.paymentDetails')}</h3></CardHeader>
        <CardContent className="space-y-4">
          <Input id="cardNumber" label={t('checkout.cardNumber')} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" />
          <Input id="cardholder" label={t('checkout.cardholder')} value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Select id="expiryMonth" label={t('checkout.expiryMonth')} value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)}
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, '0') }))} />
            <Select id="expiryYear" label={t('checkout.expiryYear')} value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)}
              options={Array.from({ length: 10 }, (_, i) => ({ value: String(2025 + i), label: String(2025 + i) }))} />
            <Input id="cvv" label={t('checkout.cvv')} value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" maxLength={4} />
          </div>
          <Select id="installments" label={t('checkout.installments')} value={installments} onChange={(e) => setInstallments(e.target.value)}
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x` }))} />
          <p className="inline-flex items-center gap-2 text-xs text-text-secondary">{t('checkout.testCardNote')}<InfoTooltip ariaLabel={t('tooltips.checkout.testCardAria')} content={<p>{t('tooltips.checkout.testCard')}</p>} /></p>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handlePay} loading={createContributionMutation.isPending || payMutation.isPending}>
        {t('checkout.pay')}
      </Button>
    </div>
  );
}
