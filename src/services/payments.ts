import { api } from '@/lib/api-client';
import type { SimulatePaymentRequest, PaymentResult, PaymentStatusResponse } from '@/types/payment';

export const paymentsService = {
  simulatePayment(data: SimulatePaymentRequest) {
    return api.post<PaymentResult>('/payments/simulate', data);
  },

  getPaymentStatus(paymentId: string) {
    return api.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
  },
};
