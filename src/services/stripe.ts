import { api } from '@/lib/api-client';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  StripeConnectStatus,
} from '@/types/payment';

type RawCreateIntentResponse = {
  payment_id?: string;
  compensation_id?: string;
  payment_status?: string;
  compensation_status?: string;
  amount?: number | string;
  currency?: string;
  processed_at?: string;
  client_secret?: string | null;
  qr_code?: string;
  copy_paste_code?: string;
  payment_intent_id?: string;
  payment_method?: string;
};

type RawStripeStatus = {
  connected?: boolean;
  stripe_account_id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  country?: string;
  onboarding_status?: string;
  pending_verification?: string[];
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export const stripeService = {
  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    const raw = await api.post<RawCreateIntentResponse>(
      '/payments/create-payment-intent',
      data
    );

    return {
      paymentId: asString(raw.payment_id),
      compensationId: asString(raw.compensation_id),
      clientSecret: raw.client_secret ?? null,
      qrCode: raw.qr_code,
      copyPasteCode: raw.copy_paste_code,
      paymentIntentId: asString(raw.payment_intent_id),
      paymentMethod: (asString(raw.payment_method, 'card') as 'card' | 'pix'),
    };
  },

  async getStripeOnboardingStatus(): Promise<StripeConnectStatus> {
    const raw = await api.get<RawStripeStatus>('/producers/stripe/status');
    const onboardingStatus = raw.onboarding_status as StripeConnectStatus['onboarding_status'] ?? undefined;
    return {
      connected: raw.connected ?? false,
      stripe_account_id: raw.stripe_account_id,
      charges_enabled: raw.charges_enabled ?? false,
      payouts_enabled: raw.payouts_enabled ?? false,
      country: raw.country,
      onboarding_status: onboardingStatus,
      pending_verification: raw.pending_verification,
    };
  },

  async startStripeOnboarding(): Promise<{ onboardingUrl: string }> {
    const raw = await api.post<{ onboarding_url: string }>(
      '/producers/stripe/onboard'
    );
    return { onboardingUrl: raw.onboarding_url };
  },

  async getStripeDashboard(): Promise<{ dashboardUrl: string }> {
    const raw = await api.post<{ dashboard_url: string }>(
      '/producers/stripe/dashboard'
    );
    return { dashboardUrl: raw.dashboard_url };
  },
};
