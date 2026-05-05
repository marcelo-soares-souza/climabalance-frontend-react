export type CompensationMode = 'tco2e' | 'tree_purchase';
export type CompensationStatus = 'pending' | 'paid' | 'canceled' | 'refunded';

export interface CompensationQuote {
  pricePerTree: number;
  totalAmount: number;
  estimatedTotalTCO2e: number;
  estimatedTotalKgCO2e20y: number;
  availableCapacity: number;
  currency: string;
  maxPurchasableTrees?: number | null;
  remainingPurchasableTrees?: number;
}

export interface CreateCompensationRequest {
  area_id: string;
  calculation_id?: string;
  compensation_mode: CompensationMode;
  total_t_co2e?: number;
  trees_count?: number;
  total_amount?: number;
  currency: string;
  trees_requested?: number;
}

export interface CompensationConfirmation {
  compensationId: string;
  areaId: string;
  compensationMode: CompensationMode;
  horizonYears: number;
  treesRequested: number;
  pricePerTree: number;
  estimatedTotalTCO2e: number;
  totalTCO2e: number;
  treesCount: number;
  totalAmount: number;
  currency: string;
  status: CompensationStatus;
  remainingTCO2e: number;
  createdAt: string;
}

export interface CompensationHistoryItem {
  id: string;
  areaId: string;
  areaName: string;
  calculationId: string | null;
  compensationMode: CompensationMode;
  totalTCO2e: number;
  treesCount: number;
  totalAmount: number;
  currency: string;
  status: CompensationStatus;
  createdAt: string;
  paidAt: string | null;
}
