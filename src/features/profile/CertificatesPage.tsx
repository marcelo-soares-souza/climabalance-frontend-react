import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usersService } from '@/services/users';
import { certificatesService } from '@/services/certificates';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatTCO2e, formatDate } from '@/lib/format';
import { Award, Download } from 'lucide-react';
import { saveAs } from 'file-saver';

export function CertificatesPage() {
  const { t } = useTranslation();
  const { userId } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['users', userId, 'certificates'],
    queryFn: () => usersService.getUserCertificates(userId!),
    enabled: !!userId,
  });

  const handleDownload = async (certId: string, certNumber: string) => {
    try {
      const blob = await certificatesService.downloadCertificate(certId);
      saveAs(blob, `${certNumber}.pdf`);
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('certificates.title')}</h1>
      {isLoading ? <SkeletonList /> : certificates && certificates.length > 0 ? (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{cert.certificateNumber}</p>
                    <p className="text-sm text-text-secondary">{cert.compensationId}</p>
                    {cert.totalTCO2e !== null && cert.treesCount !== null && (
                      <p className="text-sm">{formatTCO2e(cert.totalTCO2e)} - {cert.treesCount} {t('area.trees')}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">{cert.issuedAt ? formatDate(cert.issuedAt) : '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={cert.status} />
                    <Button variant="outline" size="sm" onClick={() => handleDownload(cert.id, cert.certificateNumber)}>
                      <Download className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Award className="h-12 w-12" />}
          title={t('certificates.empty')}
          description={t('certificates.emptyDescription')}
        />
      )}
    </div>
  );
}
