import { api } from '@/lib/api-client';
import type { CertificateValidation } from '@/types/certificate';

export const certificatesService = {
  validateCertificate(certificateNumber: string, hash: string) {
    return api.get<CertificateValidation>('/certificates/validate', {
      params: { certificate_number: certificateNumber, hash },
    });
  },

  downloadCertificate(certificateId: string) {
    return api.getBinary(`/certificates/${certificateId}/download`);
  },
};
