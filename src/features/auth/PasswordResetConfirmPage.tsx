import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { authService } from '@/services/auth';
import { CheckCircle } from 'lucide-react';
import { ApiError } from '@/lib/api-client';

export function PasswordResetConfirmPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('auth.register.passwordMismatch');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password, passwordConfirm);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'auth.passwordReset.confirmError');
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
    <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.passwordReset.confirmTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="token" label={t('auth.confirmEmail.token')} value={token} onChange={(e) => setToken(e.target.value)} required />
        <Input id="password" type="password" label={t('auth.newPassword')} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input id="passwordConfirm" type="password" label={t('auth.confirmPassword')} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
        <Button type="submit" className="w-full" loading={loading}>{t('auth.passwordReset.confirmSubmit')}</Button>
      </form>
      <Link to="/login" className="block text-center mt-4 text-sm text-primary hover:underline">{t('auth.passwordReset.backToLogin')}</Link>
    </AuthLayout>
  );
}
