import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { queryClient } from '@/config/query-client';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorBanner } from '@/components/ErrorBanner';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { formatCurrency, formatDate, formatKgCO2e } from '@/lib/format';
import { ArrowLeft, CheckCircle, XCircle, Play, MapPin } from 'lucide-react';

export function AreaAuditPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: area, isLoading } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const { data: media } = useQuery({
    queryKey: ['areas', areaId, 'media'],
    queryFn: () => areasService.listAreaMedia(areaId!),
    enabled: !!areaId,
  });

  const approveMutation = useMutation({
    mutationFn: () => areasService.approveArea(areaId!, { notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); navigate('/audit/pending-areas'); },
    onError: () => setError('audit.approveError'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => areasService.rejectArea(areaId!, rejectReason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); navigate('/audit/pending-areas'); },
    onError: () => setError('audit.rejectError'),
  });

  const activateMutation = useMutation({
    mutationFn: () => areasService.activateArea(areaId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); navigate('/audit/pending-areas'); },
  });

  if (isLoading) return <PageSkeleton />;
  if (!area) return <div>{t('common.notFound')}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('audit.review.title')}: {area.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-text-secondary"><MapPin className="h-4 w-4" /> {[area.city, area.state].filter(Boolean).join(', ')}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={area.status} />
          <InfoTooltip
            ariaLabel={t('tooltips.area.statusAria')}
            panelClassName="left-auto right-0"
            content={<p>{t('tooltips.area.statusSummary')}</p>}
          />
        </div>
      </div>

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      <Card><CardContent>
        <h3 className="font-medium mb-3">{t('audit.review.details')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-text-secondary">{t('area.form.pricePerTree')}:</span> <span className="font-medium">{area.pricePerTree != null ? formatCurrency(area.pricePerTree) : '-'}</span></div>
          <div><span className="inline-flex items-center gap-2 text-text-secondary">{t('area.tCO2ePerTree')}: <InfoTooltip ariaLabel={t('tooltips.shared.tco2ePerTreeAria')} content={<p>{t('tooltips.shared.tco2ePerTree')}</p>} /></span> <span className="font-medium">{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</span></div>
          <div><span className="text-text-secondary">{t('area.form.biome')}:</span> <span className="font-medium">{area.biome ? t(`map.biomes.${area.biome}`, area.biome) : '-'}</span></div>
          <div><span className="text-text-secondary">{t('common.createdAt')}:</span> <span className="font-medium">{formatDate(area.createdAt)}</span></div>
        </div>
        {area.description && <p className="mt-3 text-sm text-text-secondary">{area.description}</p>}
      </CardContent></Card>

      {media && media.length > 0 && (
        <Card><CardHeader><h3 className="font-medium">{t('area.media')} ({media.length})</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((m) => (
                <div key={m.id} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {m.mediaType === 'photo' ? (
                    <img src={m.url} alt={m.description || ''} className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} controls className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {area.status === 'pending_audit' && (
        <Card><CardContent className="space-y-4">
          <h3 className="font-medium">{t('audit.review.decision')}</h3>
          <Textarea id="notes" label={t('audit.review.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('audit.review.notesPlaceholder')} />
          <div className="flex gap-3">
            <Button onClick={() => approveMutation.mutate()} loading={approveMutation.isPending} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" /> {t('audit.review.approve')}
            </Button>
            <Button
              variant="danger"
              onClick={() => { if (rejectReason.trim()) rejectMutation.mutate(); }}
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" /> {t('audit.review.reject')}
            </Button>
          </div>
          <Textarea id="rejectReason" label={t('audit.review.rejectReason')} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('audit.review.rejectReasonPlaceholder')} />
        </CardContent></Card>
      )}

      {area.status === 'approved' && (
        <Button size="lg" className="w-full" onClick={() => activateMutation.mutate()} loading={activateMutation.isPending}>
          <Play className="h-5 w-5 mr-2" /> {t('audit.review.activate')}
        </Button>
      )}
    </div>
  );
}
