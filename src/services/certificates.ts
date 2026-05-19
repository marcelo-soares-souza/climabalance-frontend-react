import { api } from "@/lib/api-client";
import type { CertificateValidation } from "@/types/certificate";

type RawCertificateValidation = {
  certificate_id?: string;
  certificate_number?: string;
  compensation_id?: string;
  issued_at?: string;
  status?: string;
  is_valid?: boolean;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeValidation(
  raw: RawCertificateValidation,
): CertificateValidation {
  return {
    certificateId: asString(raw.certificate_id),
    certificateNumber: asString(raw.certificate_number),
    compensationId: asString(raw.compensation_id),
    issuedAt: asString(raw.issued_at),
    status: asString(raw.status),
    isValid: raw.is_valid === true,
  };
}

export const certificatesService = {
  validateCertificate(certificateNumber: string, hash: string) {
    return api
      .get<RawCertificateValidation>("/certificates/validate", {
        params: { certificate_number: certificateNumber, hash },
      })
      .then(normalizeValidation);
  },

  downloadCertificate(certificateId: string) {
    return api.getBinary(`/certificates/${certificateId}/download`);
  },
};
