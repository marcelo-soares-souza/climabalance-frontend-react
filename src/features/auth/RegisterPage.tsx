import { useEffect, useState } from 'react';
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
import type { HumanCheckChallenge } from '@/types/auth';
import { getAuthFieldErrors } from './auth-form-errors';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [roleKey, setRoleKey] = useState('individual');
  const [humanAnswer, setHumanAnswer] = useState('');
  const [humanCheck, setHumanCheck] = useState<HumanCheckChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHumanCheck, setLoadingHumanCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'individual', label: t('auth.register.roleIndividual') },
    { value: 'legal_entity', label: t('auth.register.roleLegalEntity') },
    { value: 'producer', label: t('auth.register.roleProducer') },
  ];

  const loadHumanCheck = async () => {
    setLoadingHumanCheck(true);
    try {
      const challenge = await authService.getHumanCheck(locale);
      setHumanCheck(challenge);
      setHumanAnswer('');
      setFieldErrors((current) => ({ ...current, human_answer: '' }));
    } catch {
      setError('auth.register.humanCheckLoadError');
    } finally {
      setLoadingHumanCheck(false);
    }
  };

  useEffect(() => {
    loadHumanCheck();
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (password !== passwordConfirm) {
      setFieldErrors({ password_confirm: t('errors.auth.register.passwordMismatch') });
      return;
    }
    if (!humanCheck?.challenge_id) {
      setError('auth.register.humanCheckLoadError');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        email,
        password,
        password_confirm: passwordConfirm,
        human_challenge_id: humanCheck.challenge_id,
        human_answer: humanAnswer,
        locale,
        role_key: roleKey,
      });
      navigate('/confirm-email', { state: { email } });
    } catch (err) {
      const nextFieldErrors = getAuthFieldErrors(err, t);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setError(err instanceof ApiError ? err.messageKey : 'auth.register.error');
      }
      if (err instanceof ApiError && err.messageKey === 'auth.register.humanCheckInvalid') {
        setFieldErrors((current) => ({ ...current, human_answer: t('errors.auth.register.humanCheckInvalid') }));
        loadHumanCheck();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.register.title')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" type="email" label={t('auth.email')} value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }} error={fieldErrors.email} required autoFocus />
        <Input id="password" type="password" label={t('auth.password')} value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }} error={fieldErrors.password} required />
        <Input id="passwordConfirm" type="password" label={t('auth.confirmPassword')} value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((current) => ({ ...current, password_confirm: '' })); }} error={fieldErrors.password_confirm} required />
        <Select id="roleKey" label={t('auth.register.role')} options={roleOptions} value={roleKey} onChange={(e) => setRoleKey(e.target.value)} />
        <Input
          id="humanAnswer"
          label={humanCheck?.question ?? t('auth.register.humanCheckLoading')}
          value={humanAnswer}
          onChange={(e) => { setHumanAnswer(e.target.value); setFieldErrors((current) => ({ ...current, human_answer: '' })); }}
          required
          disabled={loadingHumanCheck || !humanCheck}
          placeholder={t('auth.register.humanCheckPlaceholder')}
          error={fieldErrors.human_answer}
        />
        <Button type="button" variant="outline" className="w-full" onClick={loadHumanCheck} disabled={loadingHumanCheck}>
          {loadingHumanCheck ? t('auth.register.humanCheckLoading') : t('auth.register.humanCheckReload')}
        </Button>
        <Button type="submit" className="w-full" loading={loading}>{t('auth.register.submit')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-primary hover:underline">{t('auth.register.login')}</Link>
      </p>
    </AuthLayout>
  );
}
