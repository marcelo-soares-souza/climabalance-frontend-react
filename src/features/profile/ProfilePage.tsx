import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usersService } from '@/services/users';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { formatTCO2e, formatDate, formatDateTime, maskDocumentNumber } from '@/lib/format';
import { getPrimaryAccountType, getNormalizedRoles } from '@/lib/user-display';
import { User, Edit, Award, TreePine, Calculator, Leaf, Scale } from 'lucide-react';

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
  const editProfilePath = targetUserId ? `/users/${targetUserId}/profile/edit` : '/profile/edit';
  const certificatesPath = targetUserId ? `/users/${targetUserId}/certificates` : '/profile/certificates';

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
        <Card><CardContent className="text-center py-4">
          <Calculator className="h-6 w-6 text-text-primary mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-none text-text-primary">{grossDisplay.amount}</p>
            <p className="text-lg font-semibold leading-none text-text-primary">{grossDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('home.dashboard.totalFootprint')}</span>
            <InfoTooltip ariaLabel={t('home.dashboard.totalFootprint')} content={<p>{t('tooltips.dashboard.totalFootprint')}</p>} />
          </div>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <Leaf className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-none text-primary">{compensatedDisplay.amount}</p>
            <p className="text-lg font-semibold leading-none text-primary">{compensatedDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('profile.compensated')}</span>
            <InfoTooltip ariaLabel={t('profile.compensated')} content={<p>{t('tooltips.dashboard.compensated')}</p>} />
          </div>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <Scale className="h-6 w-6 text-amber-600 mx-auto mb-2" />
          <div className="space-y-1">
            <p className="break-words text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-none text-amber-700">{balanceDisplay.amount}</p>
            <p className="text-lg font-semibold leading-none text-amber-700">{balanceDisplay.unit}</p>
          </div>
          <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
            <span className="text-center leading-5">{t('home.dashboard.balance')}</span>
            <InfoTooltip ariaLabel={t('home.dashboard.balance')} content={<p>{t('tooltips.dashboard.balance')}</p>} />
          </div>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <TreePine className="h-6 w-6 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-success">{totalTrees}</p>
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

      <Button variant="outline" className="w-full" onClick={() => navigate(certificatesPath)}>
        <Award className="h-4 w-4 mr-2" /> {t('profile.viewCertificates')}
      </Button>
    </div>
  );
}
