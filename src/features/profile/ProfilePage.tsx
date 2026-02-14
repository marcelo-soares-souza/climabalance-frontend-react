import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usersService } from '@/services/users';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { formatTCO2e, formatDate } from '@/lib/format';
import { User, Edit, Award, TreePine } from 'lucide-react';

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
    queryKey: ['users', targetUserId, 'compensations'],
    queryFn: () => usersService.getUserCompensations(targetUserId!, { limit: 5 }),
    enabled: !!targetUserId,
  });

  if (loadingUser || loadingProfile) return <PageSkeleton />;

  const totalCompensated = compensations?.filter(c => c.status === 'paid').reduce((s, c) => s + c.totalTCO2e, 0) || 0;
  const totalTrees = compensations?.filter(c => c.status === 'paid').reduce((s, c) => s + c.treesCount, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
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
              <div className="flex gap-2 mt-1">
                {user?.roles?.map(r => <StatusBadge key={r} status={r} />)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile && (profile.documentNumber || profile.phone || profile.addressCity) && (
        <Card>
          <CardHeader><h3 className="font-medium">{t('profile.personalInfo')}</h3></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {profile.documentType && <div><span className="text-text-secondary">{t('profile.documentType')}:</span> {profile.documentType}</div>}
            {profile.documentNumber && <div><span className="text-text-secondary">{t('profile.documentNumber')}:</span> {profile.documentNumber}</div>}
            {profile.phone && <div><span className="text-text-secondary">{t('profile.phone')}:</span> {profile.phone}</div>}
            {profile.birthDate && <div><span className="text-text-secondary">{t('profile.birthDate')}:</span> {formatDate(profile.birthDate)}</div>}
            {profile.addressCity && <div className="col-span-2"><span className="text-text-secondary">{t('profile.address')}:</span> {[profile.addressLine1, profile.addressCity, profile.addressState, profile.addressPostalCode].filter(Boolean).join(', ')}</div>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="text-center py-4">
          <TreePine className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{formatTCO2e(totalCompensated)}</p>
          <p className="text-sm text-text-secondary">{t('profile.compensated')}</p>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <TreePine className="h-6 w-6 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-success">{totalTrees}</p>
          <p className="text-sm text-text-secondary">{t('profile.treesPlanted')}</p>
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
