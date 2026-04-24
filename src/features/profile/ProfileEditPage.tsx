import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usersService } from '@/services/users';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ApiError } from '@/lib/api-client';
import { ArrowLeft, Calendar } from 'lucide-react';

export function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const profilePath = targetUserId ? `/users/${targetUserId}/profile` : '/profile';
  const [error, setError] = useState<string | null>(null);
  const birthDatePickerRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<{
    display_name: string;
    document_type: string;
    document_number: string;
    birth_date: string;
    phone: string;
    country_code: string;
    address_line1: string;
    address_line2: string;
    address_city: string;
    address_state: string;
    address_postal_code: string;
    address_country: string;
  }>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', targetUserId, 'profile'],
    queryFn: () => usersService.getUserProfile(targetUserId!),
    enabled: !!targetUserId,
  });

  const formValues = {
    display_name: form.display_name ?? profile?.displayName ?? '',
    document_type: form.document_type ?? profile?.documentType ?? '',
    document_number: form.document_number ?? profile?.documentNumber ?? '',
    birth_date: form.birth_date ?? profile?.birthDate ?? '',
    phone: form.phone ?? profile?.phone ?? '',
    country_code: form.country_code ?? profile?.countryCode ?? 'BR',
    address_line1: form.address_line1 ?? profile?.addressLine1 ?? '',
    address_line2: form.address_line2 ?? profile?.addressLine2 ?? '',
    address_city: form.address_city ?? profile?.addressCity ?? '',
    address_state: form.address_state ?? profile?.addressState ?? '',
    address_postal_code: form.address_postal_code ?? profile?.addressPostalCode ?? '',
    address_country: form.address_country ?? profile?.addressCountry ?? 'BR',
  };

  const mutation = useMutation({
    mutationFn: () => usersService.upsertProfile(targetUserId!, formValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', targetUserId, 'profile'] });
      navigate(profilePath);
    },
    onError: (err) => setError(err instanceof ApiError ? err.messageKey : 'profile.saveError'),
  });

  const update = (
    field:
      | 'display_name'
      | 'document_type'
      | 'document_number'
      | 'birth_date'
      | 'phone'
      | 'country_code'
      | 'address_line1'
      | 'address_line2'
      | 'address_city'
      | 'address_state'
      | 'address_postal_code'
      | 'address_country',
    value: string
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return <PageSkeleton />;

  const openBirthDatePicker = () => {
    const input = birthDatePickerRef.current;
    if (!input) return;
    if ('showPicker' in input) {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('profile.editTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <Card><CardContent className="space-y-4 py-6">
          <Input id="display_name" label={t('profile.form.displayName')} value={formValues.display_name} onChange={(e) => update('display_name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select id="document_type" label={t('profile.form.documentType')} value={formValues.document_type} onChange={(e) => update('document_type', e.target.value)}
              options={[{ value: '', label: '-' }, { value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'passport', label: t('profile.form.passport') }]} />
            <Input id="document_number" label={t('profile.form.documentNumber')} value={formValues.document_number} onChange={(e) => update('document_number', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label htmlFor="birth_date" className="block text-base font-medium text-text-secondary mb-1.5">
                {t('profile.form.birthDate')}
              </label>
              <div className="flex gap-2">
                <Input
                  id="birth_date"
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  value={formValues.birth_date}
                  onChange={(e) => update('birth_date', e.target.value)}
                />
                <Button type="button" variant="outline" onClick={openBirthDatePicker} aria-label={t('profile.form.birthDate')}>
                  <Calendar className="h-4 w-4" />
                </Button>
                <input
                  ref={birthDatePickerRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                  value={formValues.birth_date}
                  onChange={(e) => update('birth_date', e.target.value)}
                />
              </div>
            </div>
            <Input id="phone" label={t('profile.form.phone')} value={formValues.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <Input id="address_line1" label={t('profile.form.addressLine1')} value={formValues.address_line1} onChange={(e) => update('address_line1', e.target.value)} />
          <Input id="address_line2" label={t('profile.form.addressLine2')} value={formValues.address_line2} onChange={(e) => update('address_line2', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="address_city" label={t('profile.form.city')} value={formValues.address_city} onChange={(e) => update('address_city', e.target.value)} />
            <Input id="address_state" label={t('profile.form.state')} value={formValues.address_state} onChange={(e) => update('address_state', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="address_postal_code" label={t('profile.form.postalCode')} value={formValues.address_postal_code} onChange={(e) => update('address_postal_code', e.target.value)} />
            <Input id="address_country" label={t('profile.form.country')} value={formValues.address_country} onChange={(e) => update('address_country', e.target.value)} />
          </div>
        </CardContent></Card>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
