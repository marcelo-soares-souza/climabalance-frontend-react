import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiError } from '@/lib/api-client';
import { getPrimaryAccountType, getRoleLabels } from '@/lib/user-display';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getLocaleOptions, getUserStatusOptions } from '@/lib/options';

export function UserEditPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState<Partial<{ email: string; status: string; locale: string; password: string; password_confirm: string }>>({});
  const localeOptions = getLocaleOptions(t);
  const statusOptions = getUserStatusOptions(t);

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersService.getUser(userId!),
    enabled: !!userId,
  });

  const formValues = {
    email: form.email ?? user?.email ?? '',
    status: form.status ?? user?.status ?? '',
    locale: form.locale ?? user?.locale ?? '',
    password: form.password ?? '',
    password_confirm: form.password_confirm ?? '',
  };

  const userIdSafe = user?.id ?? userId!;

  const updateMutation = useMutation({
    mutationFn: () => {
      const data: Record<string, string> = {};
      if (formValues.email !== user?.email) data.email = formValues.email;
      if (formValues.status !== user?.status) data.status = formValues.status;
      if (formValues.locale !== user?.locale) data.locale = formValues.locale;
      if (formValues.password) { data.password = formValues.password; data.password_confirm = formValues.password_confirm; }
      return usersService.updateUser(userIdSafe, data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); navigate('/admin/users'); },
    onError: (err) => setError(err instanceof ApiError ? err.messageKey : 'admin.users.updateError'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.deleteUser(userIdSafe),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); navigate('/admin/users'); },
  });

  const update = (field: 'email' | 'status' | 'locale' | 'password' | 'password_confirm', value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return <PageSkeleton />;
  if (!user) return <div>{t('common.notFound')}</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('admin.users.editTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}
      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}>
        <Card><CardContent className="space-y-4 py-6">
          <Input id="email" type="email" label={t('auth.email')} value={formValues.email} onChange={(e) => update('email', e.target.value)} required />
          <Select id="status" label={t('admin.users.status')} value={formValues.status} onChange={(e) => update('status', e.target.value)} required
            options={statusOptions} />
          <Select id="locale" label={t('admin.users.locale')} value={formValues.locale} onChange={(e) => update('locale', e.target.value)}
            options={localeOptions} />
          <Input id="password" type="password" label={t('admin.users.newPassword')} value={formValues.password} onChange={(e) => update('password', e.target.value)} placeholder={t('admin.users.passwordPlaceholder')} />
          {formValues.password && <Input id="password_confirm" type="password" label={t('auth.confirmPassword')} value={formValues.password_confirm} onChange={(e) => update('password_confirm', e.target.value)} />}
          <p className="text-xs text-text-secondary">{t('profile.accountType')}: {getPrimaryAccountType(user.roles, t)}</p>
          <p className="text-xs text-text-secondary">{t('admin.users.roles')}: {getRoleLabels(user.roles, t).join(', ') || '-'}</p>
        </CardContent></Card>
        <div className="flex justify-between mt-4">
          <Button variant="danger" type="button" onClick={() => setShowDelete(true)}><Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}</Button>
          <div className="flex gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={updateMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </form>
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => deleteMutation.mutate()}
        title={t('admin.users.deleteTitle')} message={t('admin.users.deleteMessage')} danger loading={deleteMutation.isPending} />
    </div>
  );
}
