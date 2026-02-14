export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';

export interface SimulatePaymentRequest {
  compensation_id: string;
  card_number: string;
  cardholder_name: string;
  expiration_month: number;
  expiration_year: number;
  cvv: string;
  installments?: number;
}

export interface PaymentResult {
  paymentId: string;
  compensationId: string;
  provider: string;
  providerReference: string;
  simulationStatus: string;
  paymentStatus: PaymentStatus;
  compensationStatus: string;
  amount: number;
  currency: string;
  installments: number;
  processedAt: string;
  certificate: {
    id: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
  } | null;
}

export type PaymentStatusResponse = PaymentResult;
