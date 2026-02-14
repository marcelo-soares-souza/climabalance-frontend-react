import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { useCompensationStore } from '@/stores/compensation-store';
import { useAuth } from '@/hooks/use-auth';
import { formatTCO2e, formatNumber, formatDate } from '@/lib/format';
import { ArrowLeft, MapPin, TreePine, CheckCircle, XCircle, Image } from 'lucide-react';

export function AreaDetailPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);

  const { data: area, isLoading } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const { data: contributions } = useQuery({
    queryKey: ['areas', areaId, 'contributions'],
    queryFn: () => areasService.listAreaContributions(areaId!),
    enabled: !!areaId,
  });

  const { data: media } = useQuery({
    queryKey: ['areas', areaId, 'media'],
    queryFn: () => areasService.listAreaMedia(areaId!),
    enabled: !!areaId,
  });

  if (isLoading) return <PageSkeleton />;
  if (!area) return <div>{t('common.notFound')}</div>;

  const available = area.totalCapacityTCO2e - area.committedTCO2e;
  const usagePct = area.totalCapacityTCO2e > 0 ? (area.committedTCO2e / area.totalCapacityTCO2e) * 100 : 0;

  const handleCompensate = () => {
    setSelection({ areaId: area.id, areaName: area.name });
    navigate('/compensation/review');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{area.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-text-secondary">
            <MapPin className="h-4 w-4" />
            <span>{[area.city, area.state].filter(Boolean).join(', ')}</span>
          </div>
        </div>
        <StatusBadge status={area.status} />
      </div>

      {area.description && (
        <Card><CardContent><p className="text-text-secondary">{area.description}</p></CardContent></Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="text-center py-4">
          <p className="text-sm text-text-secondary">{t('area.totalCapacity')}</p>
          <p className="text-xl font-bold text-primary">{formatTCO2e(area.totalCapacityTCO2e)}</p>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <p className="text-sm text-text-secondary">{t('area.committed')}</p>
          <p className="text-xl font-bold text-amber-600">{formatTCO2e(area.committedTCO2e)}</p>
        </CardContent></Card>
        <Card><CardContent className="text-center py-4">
          <p className="text-sm text-text-secondary">{t('area.available')}</p>
          <p className="text-xl font-bold text-success">{formatTCO2e(available)}</p>
        </CardContent></Card>
      </div>

      <Card><CardContent>
        <div className="flex justify-between text-sm mb-2">
          <span>{t('area.usage')}</span>
          <span>{usagePct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${usagePct}%` }} />
        </div>
      </CardContent></Card>

      {area.biome && (
        <Card><CardContent className="flex items-center gap-4">
          <Badge variant="success">{t(`map.biomes.${area.biome}`, area.biome)}</Badge>
          <span className="text-sm text-text-secondary">{t('area.tCO2ePerTree')}: {formatNumber(area.tCO2ePerTreePerYear, 'pt-BR', 4)} tCO2e/tree/year</span>
        </CardContent></Card>
      )}

      {/* Media Gallery */}
      {media && media.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> {t('area.media')} ({media.length})</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((m) => (
                <div key={m.id} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {m.mediaType === 'photo' ? (
                    <img src={`/api/v1/areas/media/${m.id}/file`} alt={m.description || ''} className="w-full h-full object-cover" />
                  ) : (
                    <video src={`/api/v1/areas/media/${m.id}/file`} controls className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributions */}
      {contributions && contributions.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-medium">{t('area.contributions')} ({contributions.length})</h3></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contributions.map((c) => (
                <div key={c.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <span>{c.userEmail}</span>
                  <span className="font-medium">{formatTCO2e(c.totalTCO2e)} ({c.treesCount} {t('area.trees')})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {area.status === 'active' && isAuthenticated && available > 0 && (
        <Button size="lg" className="w-full" onClick={handleCompensate}>
          <TreePine className="h-5 w-5 mr-2" /> {t('area.compensateNow')}
        </Button>
      )}
    </div>
  );
}
