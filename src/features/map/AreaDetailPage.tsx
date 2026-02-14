import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { useCompensationStore } from '@/stores/compensation-store';
import { useAuth } from '@/hooks/use-auth';
import { formatTCO2e, formatNumber } from '@/lib/format';
import { ArrowLeft, MapPin, TreePine, Image, Send, ShieldOff, Upload, Trash2 } from 'lucide-react';

export function AreaDetailPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, userId, isAdmin } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);
  const queryClient = useQueryClient();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

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

  const areaIdentifier = area?.id ?? areaId ?? '';

  const handleCompensate = () => {
    if (!area) return;
    setSelection({
      areaId: area.id,
      areaName: area.name,
      calculationId: null,
      compensationMode: 'tree_purchase',
      totalTCO2e: null,
      treesRequested: null,
      totalAmount: null,
    });
    navigate('/compensation/checkout');
  };

  const submitMutation = useMutation({
    mutationFn: () => areasService.submitForAudit(areaIdentifier, submitNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      setSubmitDialogOpen(false);
      setSubmitNotes('');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => areasService.suspendArea(areaIdentifier, suspendReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      setSuspendDialogOpen(false);
      setSuspendReason('');
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!areaIdentifier) throw new Error('area.not_found');
      const base64 = await fileToBase64(file);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
      return areasService.uploadAreaMedia(areaIdentifier, {
        media_type: mediaType,
        mime_type: file.type,
        file_name: file.name,
        file_base64: base64,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'media'] });
    },
  });

  const deleteMediMutation = useMutation({
    mutationFn: (mediaId: string) => areasService.deleteAreaMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'media'] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) return <PageSkeleton />;
  if (!area) return <div>{t('common.notFound')}</div>;

  const available = area.totalCapacityTCO2e - area.committedTCO2e;
  const usagePct = area.totalCapacityTCO2e > 0 ? (area.committedTCO2e / area.totalCapacityTCO2e) * 100 : 0;

  const isOwner = userId === area.ownerUserId;
  const canSubmitForAudit = isOwner && area.status === 'draft';
  const canSuspend = isAdmin && area.status === 'active';

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> {t('area.media')} ({media?.length ?? 0})</h3>
            {isOwner && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                  <Upload className="h-4 w-4 mr-1" /> {uploadMutation.isPending ? t('common.loading') : t('area.uploadMedia')}
                </Button>
              </>
            )}
          </div>
          {uploadMutation.isError && <p className="mt-2 text-sm text-error">{t('area.uploadMediaError')}</p>}
        </CardHeader>
        <CardContent>
          {media && media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((m) => (
                <div key={m.id} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {m.mediaType === 'photo' ? (
                    <img src={m.url} alt={m.description || ''} className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} controls className="w-full h-full object-cover" />
                  )}
                  {isOwner && (
                    <button
                      onClick={() => deleteMediMutation.mutate(m.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{t('area.mediaEmpty')}</p>
          )}
        </CardContent>
      </Card>

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

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {area.status === 'active' && isAuthenticated && available > 0 && (
          <Button size="lg" className="flex-1" onClick={handleCompensate}>
            <TreePine className="h-5 w-5 mr-2" /> {t('area.compensateNow')}
          </Button>
        )}
        {canSubmitForAudit && (
          <Button size="lg" variant="secondary" className="flex-1" onClick={() => setSubmitDialogOpen(true)}>
            <Send className="h-5 w-5 mr-2" /> {t('area.actions.submitForAudit')}
          </Button>
        )}
        {canSuspend && (
          <Button size="lg" variant="outline" className="flex-1 border-error text-error hover:bg-red-50" onClick={() => setSuspendDialogOpen(true)}>
            <ShieldOff className="h-5 w-5 mr-2" /> {t('area.actions.suspend')}
          </Button>
        )}
      </div>

      {/* Submit for Audit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>{t('area.submitConfirm.title')}</DialogTitle>
        <DialogContent>{t('area.submitConfirm.message')}</DialogContent>
        <Input
          label={t('area.submitConfirm.notesLabel')}
          value={submitNotes}
          onChange={(e) => setSubmitNotes(e.target.value)}
          placeholder={t('area.submitConfirm.notesPlaceholder')}
        />
        {submitMutation.isError && (
          <p className="mt-2 text-sm text-error">{t('area.submitConfirm.error')}</p>
        )}
        <DialogActions>
          <Button variant="outline" onClick={() => setSubmitDialogOpen(false)} disabled={submitMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t('common.loading') : t('area.actions.submitForAudit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Area Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)}>
        <DialogTitle>{t('area.suspendConfirm.title')}</DialogTitle>
        <DialogContent>{t('area.suspendConfirm.message')}</DialogContent>
        <Input
          label={t('area.suspendConfirm.reasonLabel')}
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          placeholder={t('area.suspendConfirm.reasonPlaceholder')}
        />
        {suspendMutation.isError && (
          <p className="mt-2 text-sm text-error">{t('area.suspendConfirm.error')}</p>
        )}
        <DialogActions>
          <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={suspendMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="outline" className="border-error text-error hover:bg-red-50" onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending}>
            {suspendMutation.isPending ? t('common.loading') : t('area.actions.suspend')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
