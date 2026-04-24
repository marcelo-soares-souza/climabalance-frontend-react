import { useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { authService } from '@/services/auth';
import { CheckCircle } from 'lucide-react';
import { ApiError } from '@/lib/api-client';

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailFromState);
  const [resent, setResent] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.confirmEmail(token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'auth.confirmEmail.error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    try {
      await authService.resendConfirmationEmail(resendEmail);
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'auth.confirmEmail.resendError');
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('auth.confirmEmail.successTitle')}</h1>
          <p className="text-text-secondary mb-6">{t('auth.confirmEmail.successMessage')}</p>
          <Link to="/login"><Button className="w-full">{t('auth.login.submit')}</Button></Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-2">{t('auth.confirmEmail.title')}</h1>
      <p className="text-text-secondary text-center mb-6">{t('auth.confirmEmail.description')}</p>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleConfirm} className="space-y-4">
        <Input id="token" label={t('auth.confirmEmail.token')} value={token} onChange={(e) => setToken(e.target.value)} required autoFocus placeholder={t('auth.confirmEmail.tokenPlaceholder')} />
        <Button type="submit" className="w-full" loading={loading}>{t('auth.confirmEmail.submit')}</Button>
      </form>
      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-sm text-text-secondary mb-2">{t('auth.confirmEmail.noToken')}</p>
        <div className="flex gap-2">
          <Input id="resendEmail" type="email" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} placeholder={t('auth.email')} className="text-sm" />
          <Button variant="outline" size="sm" onClick={handleResend} disabled={resent}>{resent ? t('auth.confirmEmail.resent') : t('auth.confirmEmail.resend')}</Button>
        </div>
      </div>
    </AuthLayout>
  );
}
