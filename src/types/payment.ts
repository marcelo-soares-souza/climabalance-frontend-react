export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export interface CreatePaymentIntentRequest {
  compensation_id: string;
  payment_method: "card" | "pix";
}

export interface CreatePaymentIntentResponse {
  paymentId: string;
  compensationId: string;
  clientSecret?: string | null;
  qrCode?: string;
  copyPasteCode?: string;
  paymentIntentId: string;
  paymentMethod: "card" | "pix";
}

export interface PixPaymentDetails {
  paymentIntentId: string;
  qrCode: string;
  copyPasteCode: string;
}

export type OnboardingStatus =
  | "complete"
  | "incomplete"
  | "pending_verification";

export interface StripeConnectStatus {
  connected: boolean;
  stripe_account_id?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  country?: string;
  onboarding_status?: OnboardingStatus;
  pending_verification?: string[];
}

export interface PaymentResult {
  paymentId: string;
  compensationId: string;
  provider: string;
  providerReference: string;
  paymentStatus: PaymentStatus;
  compensationStatus: string;
  amount: number;
  currency: string;
  processedAt: string;
  certificate: {
    id: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
  } | null;
}

export type PaymentStatusResponse = PaymentResult;
