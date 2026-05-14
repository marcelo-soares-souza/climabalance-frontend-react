import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { authService } from '@/services/auth';
import { CheckCircle } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { getAuthFieldErrors } from './auth-form-errors';

export function PasswordResetConfirmPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (password !== passwordConfirm) {
      setFieldErrors({ password_confirm: t('errors.auth.register.passwordMismatch') });
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password, passwordConfirm);
      setSuccess(true);
    } catch (err) {
      const nextFieldErrors = getAuthFieldErrors(err, t);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setError(err instanceof ApiError ? err.messageKey : 'auth.passwordReset.confirmError');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('auth.passwordReset.successTitle')}</h1>
          <p className="text-text-secondary mb-6">{t('auth.passwordReset.successMessage')}</p>
          <Button className="w-full" onClick={() => navigate('/login')}>{t('auth.login.submit')}</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <>
      <SEO title={t('seo.passwordResetConfirm.title')} />
      <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.passwordReset.confirmTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="token" label={t('auth.confirmEmail.token')} value={token} onChange={(e) => { setToken(e.target.value); setFieldErrors((current) => ({ ...current, token: '' })); }} error={fieldErrors.token} required />
        <Input id="password" type="password" label={t('auth.newPassword')} value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }} error={fieldErrors.password} required />
        <Input id="passwordConfirm" type="password" label={t('auth.confirmPassword')} value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((current) => ({ ...current, password_confirm: '' })); }} error={fieldErrors.password_confirm} required />
        <Button type="submit" className="w-full" loading={loading}>{t('auth.passwordReset.confirmSubmit')}</Button>
      </form>
      <Link to="/login" className="block text-center mt-4 text-sm text-primary hover:underline">{t('auth.passwordReset.backToLogin')}</Link>
    </AuthLayout>
    </>
  );
}
