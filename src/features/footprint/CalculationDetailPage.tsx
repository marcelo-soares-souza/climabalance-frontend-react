import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { footprintService } from '@/services/footprint';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ResultBreakdownChart } from './components/ResultBreakdownChart';
import { formatTCO2e, formatDate, formatKgCO2e } from '@/lib/format';
import { ArrowLeft, TreePine, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/use-auth';

export function CalculationDetailPage() {
  const { id, userId: routeUserId } = useParams<{ id: string; userId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId: currentUserId, isAdmin } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: calculation, isLoading } = useQuery({
    queryKey: ['calculations', id],
    queryFn: () => footprintService.getCalculation(id!),
    enabled: !!id,
  });

  const finalizeMutation = useMutation({
    mutationFn: () => footprintService.finalizeCalculation(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calculations', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => footprintService.deleteCalculation(id!),
    onSuccess: () => { navigate('/footprint/history'); queryClient.invalidateQueries({ queryKey: ['calculations'] }); },
  });

  if (isLoading) return <PageSkeleton />;
  if (!calculation) return <div>{t('common.notFound')}</div>;
  const canEditDraft = calculation.status === 'draft'
    && (isAdmin || (calculation.userId != null && calculation.userId === currentUserId));
  const editPath = routeUserId
    ? `/users/${routeUserId}/impact/calculations/${calculation.id}/edit`
    : calculation.userId
      ? `/users/${calculation.userId}/impact/calculations/${calculation.id}/edit`
      : `/footprint/calculator?draftId=${encodeURIComponent(calculation.id)}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t(`footprint.profile.${calculation.profileType}`)}</h1>
            <InfoTooltip ariaLabel={t('tooltips.footprint.profileTypeAria')} content={<p>{t('tooltips.footprint.profileType')}</p>} />
          </div>
          <p className="flex items-center gap-2 text-text-secondary">{formatDate(calculation.periodStart)} - {formatDate(calculation.periodEnd)} <InfoTooltip ariaLabel={t('tooltips.footprint.periodAria')} content={<p>{t('tooltips.footprint.period')}</p>} /></p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={calculation.status} />
          <InfoTooltip
            ariaLabel={t('tooltips.footprint.calculationStatusAria')}
            panelClassName="left-auto right-0"
            content={
              <>
                <p><strong className="text-text-primary">{t('common.status.draft')}:</strong> {t('tooltips.footprint.statusDraft')}</p>
                <p className="mt-2"><strong className="text-text-primary">{t('common.status.finalized')}:</strong> {t('tooltips.footprint.statusFinalized')}</p>
              </>
            }
          />
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary to-primary-light text-white">
        <CardContent className="py-8 text-center">
          <p className="inline-flex items-center gap-2 text-sm opacity-80">{t('footprint.result.totalEmissions')} <InfoTooltip ariaLabel={t('tooltips.footprint.totalEmissionsAria')} content={<p>{t('tooltips.footprint.totalEmissions')}</p>} /></p>
          <p className="text-4xl font-bold">{formatTCO2e(calculation.totalTCO2e)}</p>
        </CardContent>
      </Card>

      {calculation.breakdown && calculation.breakdown.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-medium mb-4">{t('footprint.result.breakdown')}</h3>
            <ResultBreakdownChart breakdown={calculation.breakdown} />
          </CardContent>
        </Card>
      )}

      {calculation.inputs && calculation.inputs.length > 0 && (
        <Card>
          <CardContent>
              <h3 className="font-medium mb-4">{t('footprint.detail.inputs')}</h3>
              <div className="space-y-2">
              {calculation.inputs.map((input) => (
                <div key={input.id} className="flex justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t(`footprint.categories.${input.category}`, input.category)}</p>
                    <p className="text-xs text-text-secondary truncate">{input.activityType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{input.quantity} {input.unit}</p>
                    <p className="text-xs text-text-secondary">{formatKgCO2e(input.kgCO2e)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {canEditDraft && (
          <>
            <Button variant="outline" onClick={() => navigate(editPath)}>
              <Edit className="h-4 w-4 mr-2" /> {t('common.edit')}
            </Button>
            <Button variant="secondary" onClick={() => finalizeMutation.mutate()} loading={finalizeMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" /> {t('footprint.result.finalize')}
            </Button>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
            </Button>
          </>
        )}
        {calculation.status !== 'draft' && (
          <Button
            onClick={() =>
              navigate(
                `/map?calculationId=${encodeURIComponent(calculation.id)}&tCO2e=${encodeURIComponent(calculation.totalTCO2e)}`
              )
            }
          >
            <TreePine className="h-4 w-4 mr-2" /> {t('footprint.result.compensate')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('footprint.detail.deleteTitle')}
        message={t('footprint.detail.deleteMessage')}
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
