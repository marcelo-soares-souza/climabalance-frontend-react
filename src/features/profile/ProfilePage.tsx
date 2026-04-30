import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth';
import { usersService } from '@/services/users';
import { areasService } from '@/services/areas';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ApiError } from '@/lib/api-client';
import { formatTCO2e, formatDate, formatDateTime, maskDocumentNumber } from '@/lib/format';
import { getPrimaryAccountType, getNormalizedRoles } from '@/lib/user-display';
import { User, Edit, Award, TreePine, Calculator, Leaf, Scale, Lock, ChevronDown, ChevronUp, Smartphone, ArrowRight, MapPin } from 'lucide-react';

function formatProfileTCO2e(value: number): { amount: string; unit: string } {
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  return {
    amount: new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value),
    unit: 'tCO2e',
  };
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const isOwnProfile = !routeUserId || routeUserId === userId;
  const editProfilePath = targetUserId ? `/users/${targetUserId}/profile/edit` : '/profile/edit';
  const certificatesPath = targetUserId ? `/users/${targetUserId}/certificates` : '/profile/certificates';
  const sessionsPath = targetUserId ? `/users/${targetUserId}/sessions` : '/profile/sessions';

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordMutation = useMutation({
    mutationFn: () => authService.changePassword(oldPassword, newPassword, newPasswordConfirm),
    onSuccess: () => {
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setShowPasswordForm(false);
      setPasswordError(null);
    },
    onError: (err) => setPasswordError(err instanceof ApiError ? err.messageKey : 'server.error'),
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['users', targetUserId],
    queryFn: () => usersService.getUser(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['users', targetUserId, 'profile'],
    queryFn: () => usersService.getUserProfile(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: compensations } = useQuery({
    queryKey: ['users', targetUserId, 'contributions'],
    queryFn: () => usersService.getUserContributions(targetUserId!, { limit: 5 }),
    enabled: !!targetUserId,
  });

  const { data: climateBalance } = useQuery({
    queryKey: ['users', targetUserId, 'climate-balance'],
    queryFn: () => usersService.getClimateBalance(targetUserId!),
    enabled: !!targetUserId,
  });

  const isProducer = user?.roles?.includes('producer');
  const { data: userAreas } = useQuery({
    queryKey: ['areas', 'owner', targetUserId],
    queryFn: () => areasService.listAreas({ ownerUserId: targetUserId! }),
    enabled: !!targetUserId && !!isProducer,
  });

  if (loadingUser || loadingProfile) return <PageSkeleton />;

  const grossEmissions = climateBalance?.grossEmissionsTCO2e ?? 0;
  const totalCompensated = climateBalance?.estimatedOffsetTCO2e ?? 0;
  const netBalance = climateBalance?.netBalanceTCO2e ?? grossEmissions - totalCompensated;
  const totalTrees = climateBalance?.totalTreesPurchased ?? 0;
  const primaryAccountType = getPrimaryAccountType(user?.roles, t);
  const roles = getNormalizedRoles(user?.roles);
  const grossDisplay = formatProfileTCO2e(grossEmissions);
  const compensatedDisplay = formatProfileTCO2e(totalCompensated);
  const balanceDisplay = formatProfileTCO2e(netBalance);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => navigate(editProfilePath)}>
          <Edit className="h-4 w-4 mr-1" /> {t('profile.edit')}
        </Button>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.displayName || user?.email}</h2>
              <p className="text-text-secondary">{user?.email}</p>
              <p className="text-sm text-text-secondary mt-1">
                <span className="font-medium text-text-primary">{t('profile.accountType')}:</span> {primaryAccountType}
              </p>
              <div className="flex gap-2 mt-1">
                {roles.map((role) => <RoleBadge key={role} role={role} />)}
              </div>
              <p className="text-xs text-text-secondary mt-2">{t('profile.memberSince')} {user?.createdAt ? formatDate(user.createdAt) : '-'}</p>
              {user?.lastLoginAt && <p className="text-xs text-text-secondary">{t('profile.lastLogin')} {formatDateTime(user.lastLoginAt)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {isOwnProfile && (
        <Card>
          <CardContent className="py-4">
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-text-secondary" />
                <span className="font-medium">{t('profile.changePassword')}</span>
              </div>
              {showPasswordForm ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
            </button>
            {showPasswordForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword !== newPasswordConfirm) {
                    setPasswordError('errors.auth.register.passwordMismatch');
                    return;
                  }
                  passwordMutation.mutate();
                }}
                className="mt-4 space-y-3 border-t border-gray-100 pt-4"
              >
                {passwordError && <ErrorBanner messageKey={passwordError} onDismiss={() => setPasswordError(null)} />}
                <Input id="old_password" type="password" label={t('profile.oldPassword')} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                <Input id="new_password" type="password" label={t('profile.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                <Input id="new_password_confirm" type="password" label={t('auth.confirmPassword')} value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} required />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" type="button" size="sm" onClick={() => { setShowPasswordForm(false); setPasswordError(null); setOldPassword(''); setNewPassword(''); setNewPasswordConfirm(''); }}>{t('common.cancel')}</Button>
                  <Button type="submit" size="sm" loading={passwordMutation.isPending}>{t('common.save')}</Button>
                </div>
                {passwordMutation.isSuccess && <p className="text-sm text-success">{t('profile.passwordChanged')}</p>}
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {profile && (profile.documentNumber || profile.phone || profile.addressCity) && (
        <Card>
          <CardHeader><h3 className="font-medium">{t('profile.personalInfo')}</h3></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {profile.documentType && <div><span className="text-text-secondary">{t('profile.documentType')}:</span> {profile.documentType}</div>}
            {profile.documentNumber && <div><span className="text-text-secondary">{t('profile.documentNumber')}:</span> {maskDocumentNumber(profile.documentNumber)}</div>}
            {profile.phone && <div><span className="text-text-secondary">{t('profile.phone')}:</span> {profile.phone}</div>}
            {profile.birthDate && <div><span className="text-text-secondary">{t('profile.birthDate')}:</span> {formatDate(profile.birthDate)}</div>}
            {profile.addressCity && <div className="col-span-2"><span className="text-text-secondary">{t('profile.address')}:</span> {[profile.addressLine1, profile.addressCity, profile.addressState, profile.addressPostalCode].filter(Boolean).join(', ')}</div>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm"><CardContent className="text-center py-4">
          <Calculator className="h-6 w-6 text-slate-700 mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-slate-800">{grossDisplay.amount}</p>
            <p className="text-sm font-semibold leading-none text-slate-700">{grossDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('home.dashboard.totalFootprint')}</span>
            <InfoTooltip ariaLabel={t('home.dashboard.totalFootprint')} content={<p>{t('tooltips.dashboard.totalFootprint')}</p>} />
          </div>
        </CardContent></Card>
        <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white shadow-sm"><CardContent className="text-center py-4">
          <Leaf className="h-6 w-6 text-emerald-700 mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-emerald-700">{compensatedDisplay.amount}</p>
            <p className="text-sm font-semibold leading-none text-emerald-600">{compensatedDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('profile.compensated')}</span>
            <InfoTooltip ariaLabel={t('profile.compensated')} content={<p>{t('tooltips.dashboard.compensated')}</p>} />
          </div>
        </CardContent></Card>
        <Card className="border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-sm"><CardContent className="text-center py-4">
          <Scale className="h-6 w-6 text-amber-700 mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-amber-700">{balanceDisplay.amount}</p>
            <p className="text-sm font-semibold leading-none text-amber-600">{balanceDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('home.dashboard.balance')}</span>
            <InfoTooltip ariaLabel={t('home.dashboard.balance')} content={<p>{t('tooltips.dashboard.balance')}</p>} />
          </div>
        </CardContent></Card>
        <Card className="border-teal-200 bg-gradient-to-b from-teal-50 to-white shadow-sm"><CardContent className="text-center py-4">
          <TreePine className="h-6 w-6 text-teal-700 mx-auto mb-2" />
          <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-teal-700">{totalTrees}</p>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('profile.treesPlanted')}</span>
            <InfoTooltip ariaLabel={t('profile.treesPlanted')} content={<p>{t('tooltips.dashboard.treesPlanted')}</p>} />
          </div>
        </CardContent></Card>
      </div>

      {compensations && compensations.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-medium">{t('profile.recentCompensations')}</h3></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {compensations.map((c) => (
                <div key={c.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <div><p className="font-medium">{c.areaName}</p><p className="text-xs text-text-secondary">{formatDate(c.createdAt)}</p></div>
                  <div className="text-right"><p className="font-medium">{formatTCO2e(c.totalTCO2e)}</p><StatusBadge status={c.status} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isProducer && userAreas && userAreas.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-medium">{t('nav.myAreas')}</h3></CardHeader>
          <CardContent className="space-y-2">
            {userAreas.map((area) => (
              <Link
                key={area.id}
                to={`/areas/${area.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{area.name}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {[area.city, area.state].filter(Boolean).join(', ')}
                      {area.biome && <span className="ml-1">· {t(`biome.${area.biome}`, area.biome)}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={area.status} />
                  <ArrowRight className="h-4 w-4 text-text-secondary" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={() => navigate(certificatesPath)}>
        <Award className="h-4 w-4 mr-2" /> {t('profile.viewCertificates')}
      </Button>
      {isOwnProfile && (
        <Button variant="outline" className="w-full" onClick={() => navigate(sessionsPath)}>
          <Smartphone className="h-4 w-4 mr-2" /> {t('profile.sessions')}
        </Button>
      )}
    </div>
  );
}
