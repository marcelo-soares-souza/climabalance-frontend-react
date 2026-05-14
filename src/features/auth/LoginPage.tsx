import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ApiError } from '@/lib/api-client';
import { getAuthFieldErrors } from './auth-form-errors';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors = getAuthFieldErrors(err, t);
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
          return;
        }
        setError(err.messageKey);
      } else {
        setError('auth.login.error');
      }
    }
  };

  return (
    <>
      <SEO title={t('seo.login.title')} />
      <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.login.title')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }}
          placeholder={t('auth.emailPlaceholder')}
          error={fieldErrors.email}
          required
          autoFocus
        />
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label={t('auth.password')}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }}
          placeholder={t('auth.passwordPlaceholder')}
          error={fieldErrors.password}
          required
          suffixIcon={<button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-text-secondary hover:text-text-primary p-1">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}
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
    </>
  );
}
