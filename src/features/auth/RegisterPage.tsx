import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from './components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ErrorBanner';
import { authService } from '@/services/auth';
import { useLocale } from '@/hooks/use-locale';
import { ApiError } from '@/lib/api-client';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [roleKey, setRoleKey] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = [
    { value: 'individual', label: t('auth.register.roleIndividual') },
    { value: 'legal_entity', label: t('auth.register.roleLegalEntity') },
    { value: 'producer', label: t('auth.register.roleProducer') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('auth.register.passwordMismatch');
      return;
    }
    setLoading(true);
    try {
      await authService.register({ email, password, password_confirm: passwordConfirm, locale, role_key: roleKey });
      navigate('/confirm-email', { state: { email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'auth.register.error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.register.title')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" type="email" label={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input id="password" type="password" label={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input id="passwordConfirm" type="password" label={t('auth.confirmPassword')} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
        <Select id="roleKey" label={t('auth.register.role')} options={roleOptions} value={roleKey} onChange={(e) => setRoleKey(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>{t('auth.register.submit')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-primary hover:underline">{t('auth.register.login')}</Link>
      </p>
    </AuthLayout>
  );
}
