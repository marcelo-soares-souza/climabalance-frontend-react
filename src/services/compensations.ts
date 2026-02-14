import { api } from '@/lib/api-client';
import type { CompensationQuote, CreateCompensationRequest, CompensationConfirmation, CompensationHistoryItem } from '@/types/compensation';
import type { AreaContribution } from '@/types/area';

type RawCompensationQuote = {
  area_id?: string;
  compensation_mode?: string;
  horizon_years?: number | string;
  trees_requested?: number | string;
  t_co2e_per_tree_per_year?: number | string;
  estimated_total_t_co2e?: number | string;
  estimated_total_kg_co2e_20y?: number | string;
  price_per_tree?: number | string;
  total_amount?: number | string;
  currency?: string;
  available_t_co2e?: number | string;
  has_capacity?: boolean;
};

type RawCompensationConfirmation = {
  compensation_id?: string;
  area_id?: string;
  compensation_mode?: string;
  horizon_years?: number | string | null;
  trees_requested?: number | string | null;
  price_per_tree?: number | string | null;
  estimated_total_t_co2e?: number | string | null;
  total_t_co2e?: number | string;
  trees_count?: number | string;
  total_amount?: number | string;
  currency?: string;
  status?: string;
  remaining_t_co2e?: number | string;
  created_at?: string;
};

type RawCompensationHistory = {
  id?: string;
  area_id?: string;
  area_name?: string | null;
  calculation_id?: string | null;
  compensation_mode?: string;
  total_t_co2e?: number | string;
  trees_count?: number | string | null;
  total_amount?: number | string;
  currency?: string;
  status?: string;
  created_at?: string;
  paid_at?: string | null;
};

type RawAreaContribution = {
  compensation_id?: string;
  supporter_user_id?: string;
  supporter_display_name?: string | null;
  trees_count?: number | string;
  total_t_co2e?: number | string;
  compensated_at?: string;
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeQuote(raw: RawCompensationQuote): CompensationQuote {
  return {
    pricePerTree: asNumber(raw.price_per_tree),
    totalAmount: asNumber(raw.total_amount),
    estimatedTotalTCO2e: asNumber(raw.estimated_total_t_co2e),
    estimatedTotalKgCO2e20y: asNumber(raw.estimated_total_kg_co2e_20y),
    availableCapacity: asNumber(raw.available_t_co2e),
    currency: asString(raw.currency, 'BRL'),
  };
}

function normalizeConfirmation(
  raw: RawCompensationConfirmation,
  request: CreateCompensationRequest
): CompensationConfirmation {
  return {
    compensationId: asString(raw.compensation_id),
    areaId: asString(raw.area_id, request.area_id),
    compensationMode: asString(raw.compensation_mode, request.compensation_mode) as CompensationConfirmation['compensationMode'],
    horizonYears: asNumber(raw.horizon_years ?? 0),
    treesRequested: asNumber(raw.trees_requested ?? request.trees_requested ?? 0),
    pricePerTree: asNumber(raw.price_per_tree ?? 0),
    estimatedTotalTCO2e: asNumber(raw.estimated_total_t_co2e ?? raw.total_t_co2e),
    totalTCO2e: asNumber(raw.total_t_co2e ?? request.total_t_co2e),
    treesCount: asNumber(raw.trees_count ?? request.trees_count ?? request.trees_requested),
    totalAmount: asNumber(raw.total_amount ?? request.total_amount),
    currency: asString(raw.currency, request.currency),
    status: asString(raw.status, 'pending') as CompensationConfirmation['status'],
    remainingTCO2e: asNumber(raw.remaining_t_co2e),
    createdAt: asString(raw.created_at),
  };
}

function normalizeHistory(raw: RawCompensationHistory): CompensationHistoryItem {
  return {
    id: asString(raw.id),
    areaId: asString(raw.area_id),
    areaName: asString(raw.area_name),
    calculationId: asNullableString(raw.calculation_id),
    compensationMode: asString(raw.compensation_mode, 'tco2e') as CompensationHistoryItem['compensationMode'],
    totalTCO2e: asNumber(raw.total_t_co2e),
    treesCount: asNumber(raw.trees_count),
    totalAmount: asNumber(raw.total_amount),
    currency: asString(raw.currency, 'BRL'),
    status: asString(raw.status, 'pending') as CompensationHistoryItem['status'],
    createdAt: asString(raw.created_at),
    paidAt: asNullableString(raw.paid_at),
  };
}

function normalizeAreaContribution(raw: RawAreaContribution): AreaContribution {
  return {
    id: asString(raw.compensation_id),
    areaId: '',
    userId: asString(raw.supporter_user_id),
    userEmail: asString(raw.supporter_display_name, asString(raw.supporter_user_id)),
    treesCount: asNumber(raw.trees_count),
    totalTCO2e: asNumber(raw.total_t_co2e),
    totalAmount: 0,
    currency: 'BRL',
    compensationMode: 'tree_purchase',
    paidAt: asString(raw.compensated_at),
  };
}

export const compensationsService = {
  createCompensation(data: CreateCompensationRequest) {
    return api
      .post<RawCompensationConfirmation>('/compensations', data)
      .then((raw) => normalizeConfirmation(raw, data));
  },

  getQuote(data: { area_id: string; trees_requested: number; currency: string }) {
    return api.post<RawCompensationQuote>('/compensations/quote', data).then(normalizeQuote);
  },

  listCompensations(params?: { status?: string; limit?: number; offset?: number }) {
    return api
      .get<RawCompensationHistory[]>('/compensations', { params: params as Record<string, string | number> })
      .then((rows) => rows.map(normalizeHistory));
  },

  listAreaContributions(areaId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<RawAreaContribution[]>(`/areas/${areaId}/contributions`, { params: params as Record<string, number> })
      .then((rows) =>
        rows.map((row) => {
          const normalized = normalizeAreaContribution(row);
          return { ...normalized, areaId };
        })
      );
  },
};
