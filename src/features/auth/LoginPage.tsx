import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ApiError } from '@/lib/api-client';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.messageKey);
      } else {
        setError('auth.login.error');
      }
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.login.title')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          required
          autoFocus
        />
        <Input
          id="password"
          type="password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder')}
          required
        />
        <Button type="submit" className="w-full" loading={isLoading}>
          {t('auth.login.submit')}
        </Button>
      </form>
      <div className="mt-6 text-center space-y-2">
        <Link to="/password-reset" className="text-sm text-primary hover:underline block">
          {t('auth.login.forgotPassword')}
        </Link>
        <p className="text-sm text-text-secondary">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-primary hover:underline">
            {t('auth.login.register')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
