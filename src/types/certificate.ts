export interface CertificateHistoryItem {
  id: string;
  certificateNumber: string;
  compensationId: string;
  status: string;
  issuedAt: string;
  fileName: string;
  mimeType: string;
  authenticityHash: string | null;
  validationUrl: string | null;
  qrCodeData: string | null;
  areaName: string | null;
  totalTCO2e: number | null;
  treesCount: number | null;
}

export interface CertificateValidation {
  certificateId: string;
  certificateNumber: string;
  compensationId: string;
  issuedAt: string;
  status: string;
  isValid: boolean;
}

export interface CertificateDownload {
  blob: Blob;
  fileName: string;
}
