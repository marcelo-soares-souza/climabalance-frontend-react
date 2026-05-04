import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paymentsService } from '@/services/payments';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Copy, Check } from 'lucide-react';

export function PixPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { paymentId } = useParams<{ paymentId: string }>();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const qrCode = (location.state as Record<string, unknown> | null)?.qrCode as string | undefined;
  const copyPasteCode = (location.state as Record<string, unknown> | null)?.copyPasteCode as string | undefined;

  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const result = await paymentsService.getPaymentStatus(paymentId);
        if (result.paymentStatus === 'paid') {
          setStatus('paid');
          clearInterval(interval);
          navigate('/compensation/report', {
            state: {
              paymentResult: result,
              summary: {
                areaName: '',
                compensationMode: 'tree_purchase',
                totalAmount: result.amount,
                currency: result.currency,
              },
            },
          });
        } else if (result.paymentStatus === 'failed') {
          setStatus('failed');
          clearInterval(interval);
        }
      } catch {
        // Continue polling on error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentId, navigate]);

  const handleCopy = async () => {
    if (copyPasteCode) {
      await navigator.clipboard.writeText(copyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (status === 'failed') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t('payment.pix.title')}</h1>
        <p className="text-text-secondary">{t('payment.pix.expired')}</p>
        <Button onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>

      <h1 className="text-2xl font-bold">{t('payment.pix.title')}</h1>

      <p className="text-text-secondary">{t('payment.pix.instructions')}</p>

      {qrCode && (
        <div className="flex justify-center">
          <img
            src={qrCode}
            alt="Pix QR Code"
            className="w-64 h-64 border rounded-lg"
          />
        </div>
      )}

      {copyPasteCode && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('payment.pix.copy_paste')}</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-gray-100 p-3 rounded text-xs break-all">
              {copyPasteCode}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? t('payment.pix.copied') : t('payment.pix.copy_button')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-text-secondary">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        <span>{t('payment.pix.waiting')}</span>
      </div>
    </div>
  );
}
