import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { stripeService } from '@/services/stripe';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ApiError } from '@/lib/api-client';
import { Check, X, ExternalLink } from 'lucide-react';

export function StripeSetupPage() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: () => stripeService.getStripeOnboardingStatus(),
  });

  const onboardMutation = useMutation({
    mutationFn: () => stripeService.startStripeOnboarding(),
    onSuccess: (data) => {
      window.location.href = data.onboardingUrl;
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.messageKey : 'producer.stripe.error');
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: () => stripeService.getStripeDashboard(),
    onSuccess: (data) => {
      window.open(data.dashboardUrl, '_blank');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.messageKey : 'producer.stripe.error');
    },
  });

  const isConnected = statusQuery.data?.connected ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('producer.stripe.title')}</h1>

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      {/* Status Card */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('producer.stripe.status')}</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span>{t('producer.stripe.charges_enabled')}</span>
            <span className="flex items-center gap-1">
              {statusQuery.data?.charges_enabled ? (
                <><Check className="h-4 w-4 text-green-500" /> {t('producer.stripe.enabled')}</>
              ) : (
                <><X className="h-4 w-4 text-red-500" /> {t('producer.stripe.disabled')}</>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('producer.stripe.payouts_enabled')}</span>
            <span className="flex items-center gap-1">
              {statusQuery.data?.payouts_enabled ? (
                <><Check className="h-4 w-4 text-green-500" /> {t('producer.stripe.enabled')}</>
              ) : (
                <><X className="h-4 w-4 text-red-500" /> {t('producer.stripe.disabled')}</>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {!isConnected && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-text-secondary">{t('producer.stripe.not_connected')}</p>
            <Button
              size="lg"
              onClick={() => onboardMutation.mutate()}
              loading={onboardMutation.isPending}
            >
              {t('producer.stripe.connect_now')}
            </Button>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => dashboardMutation.mutate()}
              loading={dashboardMutation.isPending}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('producer.stripe.dashboard')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('producer.stripe.onboarding_title')}</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{t('producer.stripe.what_is')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.what_is_desc')}</p>
          </div>
          <div>
            <p className="font-medium">{t('producer.stripe.prerequisites')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.prerequisites_desc')}</p>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-medium">{t('producer.stripe.step1')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.step1_desc')}</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">{t('producer.stripe.step2')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.step2_desc')}</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">{t('producer.stripe.step3')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.step3_desc')}</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">{t('producer.stripe.step4')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.step4_desc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('producer.stripe.faq')}</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-sm">{t('producer.stripe.faq_q1')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.faq_a1')}</p>
          </div>
          <div>
            <p className="font-medium text-sm">{t('producer.stripe.faq_q2')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.faq_a2')}</p>
          </div>
          <div>
            <p className="font-medium text-sm">{t('producer.stripe.faq_q3')}</p>
            <p className="text-sm text-text-secondary">{t('producer.stripe.faq_a3')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
