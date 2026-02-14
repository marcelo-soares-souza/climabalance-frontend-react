import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft } from 'lucide-react';

export function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    display_name: '', document_type: '', document_number: '', birth_date: '',
    phone: '', country_code: 'BR', address_line1: '', address_line2: '',
    address_city: '', address_state: '', address_postal_code: '', address_country: 'BR',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', userId, 'profile'],
    queryFn: () => usersService.getUserProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.displayName || '', document_type: profile.documentType || '',
        document_number: profile.documentNumber || '', birth_date: profile.birthDate || '',
        phone: profile.phone || '', country_code: profile.countryCode || 'BR',
        address_line1: profile.addressLine1 || '', address_line2: profile.addressLine2 || '',
        address_city: profile.addressCity || '', address_state: profile.addressState || '',
        address_postal_code: profile.addressPostalCode || '', address_country: profile.addressCountry || 'BR',
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => usersService.upsertProfile(userId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'profile'] });
      navigate('/profile');
    },
    onError: (err) => setError(err instanceof ApiError ? err.messageKey : 'profile.saveError'),
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('profile.editTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <Card><CardContent className="space-y-4 py-6">
          <Input id="display_name" label={t('profile.form.displayName')} value={form.display_name} onChange={(e) => update('display_name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select id="document_type" label={t('profile.form.documentType')} value={form.document_type} onChange={(e) => update('document_type', e.target.value)}
              options={[{ value: '', label: '-' }, { value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'passport', label: t('profile.form.passport') }]} />
            <Input id="document_number" label={t('profile.form.documentNumber')} value={form.document_number} onChange={(e) => update('document_number', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="birth_date" type="date" label={t('profile.form.birthDate')} value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
            <Input id="phone" label={t('profile.form.phone')} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <Input id="address_line1" label={t('profile.form.addressLine1')} value={form.address_line1} onChange={(e) => update('address_line1', e.target.value)} />
          <Input id="address_line2" label={t('profile.form.addressLine2')} value={form.address_line2} onChange={(e) => update('address_line2', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="address_city" label={t('profile.form.city')} value={form.address_city} onChange={(e) => update('address_city', e.target.value)} />
            <Input id="address_state" label={t('profile.form.state')} value={form.address_state} onChange={(e) => update('address_state', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="address_postal_code" label={t('profile.form.postalCode')} value={form.address_postal_code} onChange={(e) => update('address_postal_code', e.target.value)} />
            <Input id="address_country" label={t('profile.form.country')} value={form.address_country} onChange={(e) => update('address_country', e.target.value)} />
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
