import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { footprintService } from '@/services/footprint';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTCO2e, formatNumber, formatDate } from '@/lib/format';
import { Calculator, MapPin, TreePine, Award, ArrowRight, Leaf } from 'lucide-react';

export function HomePage() {
  const { isAuthenticated, userId } = useAuth();

  if (!isAuthenticated) return <UnauthenticatedHome />;
  return <AuthenticatedHome userId={userId!} />;
}

function UnauthenticatedHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <Leaf className="h-16 w-16 text-primary mx-auto mb-6" />
      <h1 className="text-4xl font-bold mb-4">{t('home.welcome.title')}</h1>
      <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">{t('home.welcome.description')}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={() => navigate('/register')}>{t('home.welcome.getStarted')}</Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/map')}>{t('home.welcome.exploreMap')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <Card><CardContent className="text-center py-8">
          <Calculator className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{t('home.welcome.step1Title')}</h3>
          <p className="text-sm text-text-secondary">{t('home.welcome.step1Description')}</p>
        </CardContent></Card>
        <Card><CardContent className="text-center py-8">
          <TreePine className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{t('home.welcome.step2Title')}</h3>
          <p className="text-sm text-text-secondary">{t('home.welcome.step2Description')}</p>
        </CardContent></Card>
        <Card><CardContent className="text-center py-8">
          <Award className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{t('home.welcome.step3Title')}</h3>
          <p className="text-sm text-text-secondary">{t('home.welcome.step3Description')}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}

function AuthenticatedHome({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: compensations, isLoading: loadingComp } = useQuery({
    queryKey: ['users', userId, 'compensations'],
    queryFn: () => usersService.getUserCompensations(userId, { limit: 5 }),
  });

  const { data: calculations, isLoading: loadingCalc } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => footprintService.listCalculations({ limit: 5 }),
  });

  const totalFootprint = calculations?.reduce((sum, c) => sum + c.totalTCO2e, 0) || 0;
  const totalCompensated = compensations?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.totalTCO2e, 0) || 0;
  const totalTrees = compensations?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.treesCount, 0) || 0;
  const balance = totalFootprint - totalCompensated;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('home.dashboard.title')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('home.dashboard.totalFootprint')} value={loadingCalc ? null : formatTCO2e(totalFootprint)} icon={<Calculator className="h-5 w-5" />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label={t('home.dashboard.compensated')} value={loadingComp ? null : formatTCO2e(totalCompensated)} icon={<TreePine className="h-5 w-5" />} color="text-success" bg="bg-green-50" />
        <StatCard label={t('home.dashboard.balance')} value={loadingCalc || loadingComp ? null : formatTCO2e(balance)} icon={<Leaf className="h-5 w-5" />} color={balance > 0 ? 'text-error' : 'text-success'} bg={balance > 0 ? 'bg-red-50' : 'bg-green-50'} />
        <StatCard label={t('home.dashboard.treesPlanted')} value={loadingComp ? null : formatNumber(totalTrees, 'pt-BR', 0)} icon={<TreePine className="h-5 w-5" />} color="text-primary" bg="bg-primary-50" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/footprint/calculator')}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-primary-50 rounded-xl"><Calculator className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <p className="font-medium">{t('home.dashboard.calculateAction')}</p>
              <p className="text-sm text-text-secondary">{t('home.dashboard.calculateDescription')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/map')}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-primary-50 rounded-xl"><MapPin className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <p className="font-medium">{t('home.dashboard.compensateAction')}</p>
              <p className="text-sm text-text-secondary">{t('home.dashboard.compensateDescription')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/profile/certificates')}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-primary-50 rounded-xl"><Award className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <p className="font-medium">{t('home.dashboard.certificatesAction')}</p>
              <p className="text-sm text-text-secondary">{t('home.dashboard.certificatesDescription')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <h2 className="font-semibold mb-4">{t('home.dashboard.recentActivity')}</h2>
          {loadingComp ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : compensations && compensations.length > 0 ? (
            <div className="space-y-3">
              {compensations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.areaName}</p>
                    <p className="text-xs text-text-secondary">{formatDate(c.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTCO2e(c.totalTCO2e)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('home.dashboard.noActivity')} description={t('home.dashboard.noActivityDescription')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | null; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
          <span className="text-sm text-text-secondary">{label}</span>
        </div>
        {value === null ? <Skeleton className="h-7 w-24" /> : <p className={`text-xl font-bold ${color}`}>{value}</p>}
      </CardContent>
    </Card>
  );
}
