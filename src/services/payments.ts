import { api } from '@/lib/api-client';
import type { SimulatePaymentRequest, PaymentResult, PaymentStatusResponse } from '@/types/payment';

type RawCertificate = {
  id?: string;
  certificate_number?: string;
  status?: string;
  issued_at?: string;
};

type RawPayment = {
  payment_id?: string;
  compensation_id?: string;
  provider?: string;
  provider_reference?: string;
  simulation_status?: string;
  payment_status?: string;
  compensation_status?: string;
  amount?: number | string;
  currency?: string;
  installments?: number | string;
  processed_at?: string;
  certificate?: RawCertificate | null;
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizePayment(raw: RawPayment): PaymentResult {
  return {
    paymentId: asString(raw.payment_id),
    compensationId: asString(raw.compensation_id),
    provider: asString(raw.provider),
    providerReference: asString(raw.provider_reference),
    simulationStatus: asString(raw.simulation_status),
    paymentStatus: asString(raw.payment_status, 'pending') as PaymentResult['paymentStatus'],
    compensationStatus: asString(raw.compensation_status),
    amount: asNumber(raw.amount),
    currency: asString(raw.currency, 'USD'),
    installments: asNumber(raw.installments, 1),
    processedAt: asString(raw.processed_at),
    certificate: raw.certificate
      ? {
          id: asString(raw.certificate.id),
          certificateNumber: asString(raw.certificate.certificate_number),
          status: asString(raw.certificate.status),
          issuedAt: asString(raw.certificate.issued_at),
        }
      : null,
  };
}

export const paymentsService = {
  simulatePayment(data: SimulatePaymentRequest) {
    return api.post<RawPayment>('/payments/simulate', data).then(normalizePayment);
  },

  getPaymentStatus(paymentId: string) {
    return api.get<RawPayment>(`/payments/${paymentId}/status`).then((raw) => normalizePayment(raw) as PaymentStatusResponse);
  },
};
