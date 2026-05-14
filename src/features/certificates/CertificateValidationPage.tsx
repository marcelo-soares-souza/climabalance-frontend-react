import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { SEO } from '@/components/SEO';
import { certificatesService } from '@/services/certificates';
import type { CertificateValidation } from '@/types/certificate';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { ShieldCheck, ShieldX, Search } from 'lucide-react';

export function CertificateValidationPage() {
  const { t } = useTranslation();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [hash, setHash] = useState('');

  const validateMutation = useMutation({
    mutationFn: () => certificatesService.validateCertificate(certificateNumber.trim(), hash.trim()),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateNumber.trim() || !hash.trim()) return;
    validateMutation.mutate();
  };

  const result = validateMutation.data as CertificateValidation | undefined;

  return (
    <>
      <SEO title={t('seo.certificateValidation.title')} description={t('seo.certificateValidation.description')} />
      <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">{t('certificates.validate.title')}</h1>
          <InfoTooltip
            ariaLabel={t('tooltips.certificates.validationAria')}
            content={<p>{t('tooltips.certificates.validation')}</p>}
          />
        </div>
        <p className="text-text-secondary mt-2">{t('certificates.validate.description')}</p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('certificates.validate.certificateNumber')}
              labelAdornment={
                <InfoTooltip
                  ariaLabel={t('tooltips.certificates.certificateNumberAria')}
                  content={<p>{t('tooltips.certificates.certificateNumber')}</p>}
                />
              }
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              placeholder={t('certificates.validate.certificateNumberPlaceholder')}
              required
            />
            <Input
              label={t('certificates.validate.hash')}
              labelAdornment={
                <InfoTooltip
                  ariaLabel={t('tooltips.certificates.hashAria')}
                  content={<p>{t('tooltips.certificates.hash')}</p>}
                />
              }
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder={t('certificates.validate.hashPlaceholder')}
              required
            />
            <Button type="submit" className="w-full" disabled={validateMutation.isPending}>
              <Search className="h-4 w-4 mr-2" />
              {validateMutation.isPending ? t('common.loading') : t('certificates.validate.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {validateMutation.isError && (
        <Card className="border-l-4 border-l-error">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldX className="h-6 w-6 text-error flex-shrink-0" />
            <p className="text-error">{t('certificates.validate.error')}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className={`border-l-4 ${result.isValid ? 'border-l-green-400' : 'border-l-error'}`}>
          <CardContent className="py-5">
            <div className="flex items-center gap-3 mb-4">
              {result.isValid ? (
                <ShieldCheck className="h-8 w-8 text-success flex-shrink-0" />
              ) : (
                <ShieldX className="h-8 w-8 text-error flex-shrink-0" />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {result.isValid ? t('certificates.validate.valid') : t('certificates.validate.invalid')}
                </p>
                <p className="text-sm text-text-secondary">
                  {result.isValid ? t('certificates.validate.validDescription') : t('certificates.validate.invalidDescription')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm text-text-secondary">{t('certificates.validate.certificateNumber')}</p>
                <p className="font-medium">{result.certificateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('common.statusLabel')}</p>
                <StatusBadge status={result.status} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('certificates.validate.issuedAt')}</p>
                <p className="font-medium">{formatDate(result.issuedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
