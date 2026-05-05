import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export function StripePlatformSetupPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('platform.stripe.title')}</h1>

      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('platform.stripe.checklist_title')}</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-secondary">
          <p>{t('platform.stripe.step1')}</p>
          <p>{t('platform.stripe.step2')}</p>
          <p>{t('platform.stripe.step3')}</p>
          <p>{t('platform.stripe.step4')}</p>
          <p>{t('platform.stripe.step5')}</p>
          <p>{t('platform.stripe.step6')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('platform.stripe.required_env_title')}</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-secondary">
          <p>`STRIPE_SECRET_KEY`</p>
          <p>`STRIPE_WEBHOOK_SECRET`</p>
          <p>`STRIPE_PLATFORM_FEE_PERCENT`</p>
          <p>`VITE_STRIPE_PUBLISHABLE_KEY`</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-medium">{t('platform.stripe.docs_title')}</h3>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary">
          <p>{t('platform.stripe.docs_desc')}</p>
          <p className="mt-2 font-mono">HOW_TO_CONFIG_WEBHOOK_STRIPE.md</p>
        </CardContent>
      </Card>
    </div>
  );
}
