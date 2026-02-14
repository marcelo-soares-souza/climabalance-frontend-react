import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { compensationsService } from '@/services/compensations';
import { paymentsService } from '@/services/payments';
import { useCompensationStore } from '@/stores/compensation-store';
import { queryClient } from '@/config/query-client';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ErrorBanner';
import { formatCurrency, formatTCO2e } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import { ArrowLeft, CreditCard, CheckCircle, Award } from 'lucide-react';
import type { PaymentResult } from '@/types/payment';

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
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const createCompensationMutation = useMutation({
    mutationFn: () => compensationsService.createCompensation({
      area_id: store.areaId!,
      calculation_id: store.calculationId || undefined,
      compensation_mode: store.compensationMode!,
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
    onSuccess: (result) => {
      setPaymentResult(result);
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      store.clearSelection();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.messageKey : 'payment.error');
    },
  });

  const handlePay = async () => {
    setError(null);
    try {
      const compensation = await createCompensationMutation.mutateAsync();
      payMutation.mutate(compensation.compensationId);
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'compensation.error');
    }
  };

  if (paymentResult) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-6">
        <CheckCircle className="h-20 w-20 text-success mx-auto" />
        <h1 className="text-2xl font-bold">{t('checkout.success.title')}</h1>
        <p className="text-text-secondary">{t('checkout.success.message')}</p>
        <Card>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{t('checkout.success.amount')}</span><span className="font-medium">{formatCurrency(paymentResult.amount)}</span></div>
            <div className="flex justify-between"><span>{t('checkout.success.status')}</span><span className="font-medium text-success">{paymentResult.paymentStatus}</span></div>
            {paymentResult.certificate && (
              <div className="flex justify-between"><span>{t('checkout.success.certificate')}</span><span className="font-medium">{paymentResult.certificate.certificateNumber}</span></div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          {paymentResult.certificate && (
            <Button variant="outline" onClick={() => navigate('/profile/certificates')}>
              <Award className="h-4 w-4 mr-2" /> {t('checkout.success.viewCertificates')}
            </Button>
          )}
          <Button onClick={() => navigate('/')}>{t('common.backToHome')}</Button>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between"><span>{t('checkout.mode')}</span><span className="font-medium">{t(`compensation.mode.${store.compensationMode}`)}</span></div>
          {store.treesRequested && <div className="flex justify-between"><span>{t('checkout.trees')}</span><span className="font-medium">{store.treesRequested}</span></div>}
          {store.totalTCO2e && <div className="flex justify-between"><span>{t('checkout.tco2e')}</span><span className="font-medium">{formatTCO2e(store.totalTCO2e)}</span></div>}
          {store.totalAmount && <div className="flex justify-between text-lg font-bold border-t pt-2"><span>{t('checkout.total')}</span><span className="text-primary">{formatCurrency(store.totalAmount)}</span></div>}
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
          <p className="text-xs text-text-secondary">{t('checkout.testCardNote')}</p>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handlePay} loading={createCompensationMutation.isPending || payMutation.isPending}>
        {t('checkout.pay')}
      </Button>
    </div>
  );
}
