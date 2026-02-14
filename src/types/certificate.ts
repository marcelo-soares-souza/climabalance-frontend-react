export interface CertificateHistoryItem {
  id: string;
  certificateNumber: string;
  compensationId: string;
  status: string;
  issuedAt: string;
  areaName: string;
  totalTCO2e: number;
  treesCount: number;
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
