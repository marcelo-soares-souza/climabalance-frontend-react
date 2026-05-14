import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '@/components/SEO';
import { AuthLayout } from './components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { authService } from '@/services/auth';
import { useLocale } from '@/hooks/use-locale';
import { ApiError } from '@/lib/api-client';
import { getAuthFieldErrors } from './auth-form-errors';
import { cn } from '@/lib/cn';

const PWD_SEQUENCES = [
  '0123', '1234', '2345', '3456', '4567', '5678', '6789',
  '9876', '8765', '7654', '6543', '5432', '4321', '3210',
  'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij', 'hijk',
  'ijkl', 'jklm', 'klmn', 'lmno', 'mnop', 'nopq', 'opqr', 'pqrs',
  'qrst', 'rstu', 'stuv', 'tuvw', 'uvwx', 'vwxy', 'wxyz',
  'zyxw', 'yxwv', 'xwvu', 'wvut', 'vuts', 'utsr', 'tsrq', 'srqp',
  'rqpo', 'qpon', 'ponm', 'onml', 'nmlk', 'mlkj', 'lkji', 'kjih',
  'jihg', 'ihgf', 'hgfe', 'gfed', 'fedc', 'edcb', 'dcba',
];

function hasSequential(value: string): boolean {
  const lower = value.toLowerCase();
  return PWD_SEQUENCES.some((seq) => lower.includes(seq));
}

function validatePassword(value: string): string | null {
  if (value.length < 8) return 'auth.validation.password.tooShort';
  if (!/[0-9]/.test(value)) return 'auth.validation.password.noNumber';
  if (!/[!@#$%^&*(),.?":{}|<>_\-[\]\\/`~]/.test(value)) return 'auth.validation.password.noSpecial';
  if (hasSequential(value)) return 'auth.validation.password.sequential';
  return null;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [roleKey, setRoleKey] = useState('');
  const [humanAnswer, setHumanAnswer] = useState('');
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'individual', label: t('auth.register.roleIndividual') },
    // { value: 'legal_entity', label: t('auth.register.roleLegalEntity') },
    { value: 'producer', label: t('auth.register.roleProducer') },
  ];

  const { data: humanCheck, isLoading: loadingHumanCheck, refetch: refetchHumanCheck } = useQuery({
    queryKey: ['human-check', locale],
    queryFn: () => authService.getHumanCheck(locale),
    enabled: !!locale,
  });

  const reloadHumanCheck = () => {
    setHumanAnswer('');
    setFieldErrors((current) => ({ ...current, human_answer: '' }));
    refetchHumanCheck();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setConsentError(false);
    if (!roleKey) {
      setFieldErrors({ role_key: t('errors.auth.register.roleRequired') });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setFieldErrors({ password: t(passwordError) });
      return;
    }
    if (password !== passwordConfirm) {
      setFieldErrors({ password_confirm: t('errors.auth.register.passwordMismatch') });
      return;
    }
    if (!acceptedConsent) {
      setConsentError(true);
      return;
    }
    if (!humanCheck?.challenge_id) {
      setError('auth.register.humanCheckLoadError');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        name,
        email,
        password,
        password_confirm: passwordConfirm,
        human_challenge_id: humanCheck.challenge_id,
        human_answer: humanAnswer,
        locale,
        role_key: roleKey,
        accepted_privacy: true,
        accepted_terms: true,
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
        reloadHumanCheck();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={t('seo.register.title')} description={t('seo.register.description')} />
      <AuthLayout>
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.register.title')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} className="mb-4" />}
      <p className="mb-4 text-center text-sm text-text-secondary">
        {t('auth.register.needHelpChoosingRole')}{' '}
        <Link to="/how-to-use" className="text-primary hover:underline">
          {t('auth.register.howToUseLink')}
        </Link>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" type="text" label={t('auth.name')} placeholder={t('auth.namePlaceholder')} value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((current) => ({ ...current, name: '' })); }} error={fieldErrors.name} required autoFocus />
        <Input id="email" type="email" label={t('auth.email')} value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }} error={fieldErrors.email} required />
        <Input id="password" type={showPassword ? 'text' : 'password'} label={t('auth.password')} value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }} error={fieldErrors.password} required suffixIcon={<button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-text-secondary hover:text-text-primary p-1">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>} />
        <Input id="passwordConfirm" type={showPasswordConfirm ? 'text' : 'password'} label={t('auth.confirmPassword')} value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((current) => ({ ...current, password_confirm: '' })); }} error={fieldErrors.password_confirm} required suffixIcon={<button type="button" tabIndex={-1} onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="text-text-secondary hover:text-text-primary p-1">{showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>} />
        <Select
          id="roleKey"
          label={t('auth.register.role')}
          required
          labelAdornment={
            <InfoTooltip
              ariaLabel={t('auth.register.roleHelpAria')}
              content={
                <>
                  <p className="font-semibold text-text-primary">{t('auth.register.roleHelpTitle')}</p>
                  <p className="mt-2"><strong className="text-text-primary">{t('auth.register.roleIndividual')}:</strong> {t('auth.register.roleIndividualDescription')}</p>
                  {/* <p className="mt-2"><strong className="text-text-primary">{t('auth.register.roleLegalEntity')}:</strong> {t('auth.register.roleLegalEntityDescription')}</p> */}
                  <p className="mt-2"><strong className="text-text-primary">{t('auth.register.roleProducer')}:</strong> {t('auth.register.roleProducerDescription')}</p>
                </>
              }
            />
          }
          placeholder={t('auth.register.rolePlaceholder')}
          options={roleOptions}
          value={roleKey}
          error={fieldErrors.role_key}
          onChange={(e) => { setRoleKey(e.target.value); setFieldErrors((current) => ({ ...current, role_key: '' })); }}
        />
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
        <Button type="button" variant="outline" className="w-full" onClick={reloadHumanCheck} disabled={loadingHumanCheck}>
          {loadingHumanCheck ? t('auth.register.humanCheckLoading') : t('auth.register.humanCheckReload')}
        </Button>
        <label className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-50/30 p-3">
          <input
            type="checkbox"
            checked={acceptedConsent}
            onChange={(e) => { setAcceptedConsent(e.target.checked); setConsentError(false); }}
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 rounded border-primary text-primary focus:ring-primary',
              consentError && 'border-error'
            )}
          />
          <span className={cn('text-xs leading-relaxed text-text-secondary', consentError && 'text-error')}>
            <Trans
              i18nKey="auth.register.privacyAgreement"
              components={{
                privacyLink: <Link to="/privacy-policy" className="text-primary hover:underline" />,
                termsLink: <Link to="/terms-of-use" className="text-primary hover:underline" />,
              }}
            />
          </span>
        </label>
        {consentError && (
          <p className="text-xs text-error">{t('auth.register.consentRequired')}</p>
        )}
        <Button type="submit" className="w-full" loading={loading}>{t('auth.register.submit')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-primary hover:underline">{t('auth.register.login')}</Link>
      </p>
    </AuthLayout>
    </>
  );
}
