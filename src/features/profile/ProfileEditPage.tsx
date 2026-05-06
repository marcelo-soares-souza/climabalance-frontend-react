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
import { ArrowLeft, Calendar, Upload, User } from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { countries } from '@/lib/countries';
import { API_URL } from '@/config/api';

type FormField =
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
  | 'address_country'
  | 'about'
  | 'website_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'x_url'
  | 'bluesky_url'
  | 'mastodon_url'
  | 'youtube_url'
  | 'linkedin_url';

export function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const profilePath = targetUserId ? `/users/${targetUserId}/profile` : '/profile';
  const [error, setError] = useState<string | null>(null);
  const birthDatePickerRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form, setForm] = useState<Partial<Record<FormField, string>>>({});

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
    about: form.about ?? profile?.about ?? '',
    website_url: form.website_url ?? profile?.websiteUrl ?? '',
    instagram_url: form.instagram_url ?? profile?.instagramUrl ?? '',
    facebook_url: form.facebook_url ?? profile?.facebookUrl ?? '',
    x_url: form.x_url ?? profile?.xUrl ?? '',
    bluesky_url: form.bluesky_url ?? profile?.blueskyUrl ?? '',
    mastodon_url: form.mastodon_url ?? profile?.mastodonUrl ?? '',
    youtube_url: form.youtube_url ?? profile?.youtubeUrl ?? '',
    linkedin_url: form.linkedin_url ?? profile?.linkedinUrl ?? '',
  };

  const mutation = useMutation({
    mutationFn: () => usersService.upsertProfile(targetUserId!, formValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', targetUserId, 'profile'] });
      navigate(profilePath);
    },
    onError: (err) => setError(err instanceof ApiError ? err.messageKey : 'profile.saveError'),
  });

  const update = (field: FormField, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('profile.avatar.unsupported_type');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('profile.avatar.too_large');
      return;
    }

    setAvatarUploading(true);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await usersService.uploadAvatar(targetUserId, {
        mime_type: file.type,
        file_base64: base64,
      });

      queryClient.invalidateQueries({ queryKey: ['users', targetUserId, 'profile'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'profile.avatar.upload_error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) return <PageSkeleton />;

  const openBirthDatePicker = () => {
    const input = birthDatePickerRef.current;
    if (!input) return;
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }
    pickerInput.focus();
    pickerInput.click();
  };

  const avatarSrc = profile?.avatarPath
    ? `${API_URL}/api/v1/users/${targetUserId}/profile/avatar/file`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{t('profile.editTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Card><CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={avatarUploading}>
                <Upload className="h-4 w-4 mr-1" /> {t('profile.form.avatar')}
              </Button>
            </div>
          </div>

          <Input id="display_name" label={t('profile.form.displayName')} value={formValues.display_name} onChange={(e) => update('display_name', e.target.value)} required />
          <Input id="document_number" label={t('profile.form.documentNumber')} value={formValues.document_number} onChange={(e) => update('document_number', e.target.value)} />
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
            <Combobox
              id="address_country"
              label={t('profile.form.country')}
              value={formValues.address_country}
              options={countries.map((c) => ({ value: c.code, label: c.name }))}
              emptyLabel="—"
              placeholder={t('profile.form.countryPlaceholder') || 'Type to search...'}
              onChange={(val) => update('address_country', val)}
            />
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 py-6">
          <h3 className="font-medium">{t('profile.about')}</h3>
          <textarea
            id="about"
            maxLength={4000}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('profile.form.aboutPlaceholder')}
            value={formValues.about}
            onChange={(e) => update('about', e.target.value)}
          />
          <p className="text-xs text-text-secondary text-right">{formValues.about.length}/4000</p>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 py-6">
          <h3 className="font-medium">{t('profile.links')}</h3>
          <Input id="website_url" label={t('profile.form.websiteUrl')} type="url" value={formValues.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" />
          <Input id="instagram_url" label="Instagram" type="url" value={formValues.instagram_url} onChange={(e) => update('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
          <Input id="facebook_url" label="Facebook" type="url" value={formValues.facebook_url} onChange={(e) => update('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
          <Input id="x_url" label="X (Twitter)" type="url" value={formValues.x_url} onChange={(e) => update('x_url', e.target.value)} placeholder="https://x.com/..." />
          <Input id="bluesky_url" label="Bluesky" type="url" value={formValues.bluesky_url} onChange={(e) => update('bluesky_url', e.target.value)} placeholder="https://bsky.app/..." />
          <Input id="mastodon_url" label="Mastodon" type="url" value={formValues.mastodon_url} onChange={(e) => update('mastodon_url', e.target.value)} placeholder="https://..." />
          <Input id="youtube_url" label="YouTube" type="url" value={formValues.youtube_url} onChange={(e) => update('youtube_url', e.target.value)} placeholder="https://youtube.com/..." />
          <Input id="linkedin_url" label="LinkedIn" type="url" value={formValues.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </CardContent></Card>

        <div className="flex gap-3 mt-4">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
