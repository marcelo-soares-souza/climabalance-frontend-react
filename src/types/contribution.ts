export type ContributionMode = "tco2e" | "tree_purchase";
export type ContributionStatus = "pending" | "paid" | "canceled" | "refunded";

export interface ContributionQuote {
  pricePerTree: number;
  totalAmount: number;
  estimatedTotalTCO2e: number;
  estimatedTotalKgCO2e: number;
  estimatedKgCO2PerTreePerYear: number;
  horizonYears: number;
  currency: string;
  maxPurchasableTrees: number;
  remainingPurchasableTrees: number;
  producerStripeConnected: boolean;
  producerChargesEnabled: boolean;
  producerReadyToReceiveSupport: boolean;
}

export interface CreateContributionRequest {
  area_id: string;
  calculation_id?: string;
  compensation_mode: ContributionMode;
  total_t_co2e?: number;
  trees_count?: number;
  total_amount?: number;
  currency: string;
  trees_requested?: number;
}

export interface ContributionConfirmation {
  compensationId: string;
  areaId: string;
  compensationMode: ContributionMode;
  horizonYears: number;
  treesRequested: number;
  pricePerTree: number;
  estimatedTotalTCO2e: number;
  totalTCO2e: number;
  treesCount: number;
  totalAmount: number;
  currency: string;
  status: ContributionStatus;
  createdAt: string;
}

export interface ContributionHistoryItem {
  id: string;
  areaId: string;
  areaName: string;
  areaSlug?: string;
  calculationId: string | null;
  compensationMode: ContributionMode;
  totalTCO2e: number;
  treesCount: number;
  totalAmount: number;
  currency: string;
  status: ContributionStatus;
  createdAt: string;
  paidAt: string | null;
}
