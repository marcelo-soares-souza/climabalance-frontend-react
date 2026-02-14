import { api } from '@/lib/api-client';
import type {
  FootprintCalculation,
  CalculationResult,
  EmissionFactor,
  CompensationProjection,
  CreateCalculationRequest,
  UpdateCalculationRequest,
  FootprintInput,
  ProfileType,
  InputCategory,
  DataQuality,
  CalculationStatus,
  FootprintInputDetail,
} from '@/types/footprint';
import { API_BASE } from '@/config/api';

type ApiBreakdownItem = {
  category: string;
  kg_co2e: number;
  t_co2e: number;
};

type ApiCalculationBase = {
  id?: string;
  calculation_id?: string;
  user_id?: string;
  profile_type?: string;
  period_start?: string;
  period_end?: string;
  total_kg_co2e: number;
  total_t_co2e: number;
  status?: string;
  data_quality?: string;
  factors_version?: string;
  region?: string;
  breakdown?: ApiBreakdownItem[];
  created_at?: string;
  updated_at?: string;
};

type ApiCreateCalculationResponse = ApiCalculationBase & {
  calculation_id: string;
  breakdown: ApiBreakdownItem[];
};

type ApiGetCalculationResponse = ApiCalculationBase & {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  period_start: string;
  period_end: string;
  status: CalculationStatus;
  data_quality: DataQuality;
  factors_version: string;
  created_at: string;
  updated_at: string;
  inputs: Array<{
    id: string;
    category: string;
    activity_type: string;
    quantity: number;
    unit: string;
    kg_co2e: number;
    metadata: Record<string, unknown> | null;
  }>;
  breakdown: ApiBreakdownItem[];
};

type ApiGuestCalculationResponse = {
  total_kg_co2e: number;
  total_t_co2e: number;
  breakdown: ApiBreakdownItem[];
  data_quality: DataQuality;
  factors_version: string;
};

type ApiEmissionFactor = {
  id: string;
  activity_type: string;
  factor_value: number;
  factor_unit: string;
  region: string;
  version: string;
};

type ApiCompensationProjection = {
  projection_id?: string;
  calculation_id?: string;
  area_id?: string;
  biome?: string | null;
  t_co2e_per_tree_per_year?: number;
  trees_needed?: number;
  horizon_years?: number;
};

function normalizeBreakdown(items: ApiBreakdownItem[], totalKgCO2e: number) {
  return items.map((item) => ({
    category: item.category,
    totalKgCO2e: item.kg_co2e,
    totalTCO2e: item.t_co2e,
    percentage: totalKgCO2e > 0 ? (item.kg_co2e / totalKgCO2e) * 100 : 0,
  }));
}

function normalizeCalculation(raw: ApiCalculationBase, defaults: Partial<CalculationResult> = {}): CalculationResult {
  const now = new Date().toISOString();
  const totalKgCO2e = raw.total_kg_co2e ?? defaults.totalKgCO2e ?? 0;

  return {
    id: raw.id ?? raw.calculation_id ?? defaults.id ?? '',
    userId: raw.user_id ?? defaults.userId,
    profileType: (raw.profile_type ?? defaults.profileType ?? 'individual') as ProfileType,
    periodStart: raw.period_start ?? defaults.periodStart ?? '',
    periodEnd: raw.period_end ?? defaults.periodEnd ?? '',
    totalKgCO2e,
    totalTCO2e: raw.total_t_co2e ?? defaults.totalTCO2e ?? totalKgCO2e / 1000,
    status: (raw.status ?? defaults.status ?? 'draft') as CalculationStatus,
    dataQuality: (raw.data_quality ?? defaults.dataQuality ?? 'estimated') as DataQuality,
    factorsVersion: raw.factors_version ?? defaults.factorsVersion ?? '',
    region: raw.region ?? defaults.region,
    breakdown: normalizeBreakdown(raw.breakdown ?? [], totalKgCO2e),
    createdAt: raw.created_at ?? defaults.createdAt ?? now,
    updatedAt: raw.updated_at ?? defaults.updatedAt ?? now,
  };
}

function normalizeInput(raw: ApiGetCalculationResponse['inputs'][number], calculationId: string): FootprintInputDetail {
  return {
    id: raw.id,
    calculationId,
    category: raw.category as InputCategory,
    unit: raw.unit,
    value: raw.quantity,
    activityType: raw.activity_type,
    quantity: raw.quantity,
    kgCO2e: raw.kg_co2e,
    metadata: raw.metadata,
  };
}

function normalizeProjection(raw: ApiCompensationProjection, totalTCO2e: number): CompensationProjection {
  return {
    projectionId: raw.projection_id ?? '',
    calculationId: raw.calculation_id ?? '',
    areaId: raw.area_id ?? '',
    biome: raw.biome ?? null,
    totalTCO2e,
    treesNeeded: raw.trees_needed ?? 0,
    horizonYears: raw.horizon_years ?? 0,
    tCO2ePerTreePerYear: raw.t_co2e_per_tree_per_year ?? 0,
  };
}

export const footprintService = {
  createCalculation(data: CreateCalculationRequest) {
    return api.post<ApiCreateCalculationResponse>('/footprint/calculations', data).then((raw) =>
      normalizeCalculation(raw, {
        id: raw.calculation_id,
        profileType: data.profile_type,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        dataQuality: data.data_quality ?? 'estimated',
        status: 'draft',
      })
    );
  },

  getCalculation(id: string) {
    return api.get<ApiGetCalculationResponse>(`/footprint/calculations/${id}`).then((raw) => {
      const calculation = normalizeCalculation(raw);
      return {
        ...calculation,
        inputs: raw.inputs.map((input) => normalizeInput(input, calculation.id)),
      } as FootprintCalculation;
    });
  },

  updateCalculation(id: string, data: UpdateCalculationRequest) {
    return api.patch<void>(`/footprint/calculations/${id}`, data);
  },

  finalizeCalculation(id: string) {
    return api.post<void>(`/footprint/calculations/${id}/finalize`);
  },

  deleteCalculation(id: string) {
    return api.delete<void>(`/footprint/calculations/${id}`);
  },

  listCalculations(params?: { status?: string; profile_type?: string; limit?: number; offset?: number }) {
    return api
      .get<ApiCalculationBase[]>('/footprint/calculations', { params: params as Record<string, string | number> })
      .then((rows) => rows.map((row) => normalizeCalculation(row)));
  },

  getEmissionFactors(params?: { category?: string; unit?: string; version?: string; region?: string }): Promise<EmissionFactor[]> {
    return api.get<ApiEmissionFactor[]>('/footprint/emission-factors', { params: params as Record<string, string> }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        category: row.activity_type,
        factor: row.factor_value,
        unit: row.factor_unit,
        version: row.version,
        region: row.region,
      }))
    );
  },

  async calculateGuest(
    profileType: ProfileType,
    periodStart: string,
    periodEnd: string,
    inputs: FootprintInput[],
    dataQuality?: DataQuality
  ) {
    const res = await fetch(`${API_BASE}/footprint/calculate-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_type: profileType,
        period_start: periodStart,
        period_end: periodEnd,
        data_quality: dataQuality,
        inputs,
      }),
    });
    if (!res.ok) throw new Error('Calculation failed');
    const json = await res.json();
    const raw = (json.data || json) as ApiGuestCalculationResponse;
    return normalizeCalculation(
      {
        ...raw,
        status: 'finalized',
      },
      {
        id: 'guest',
        profileType,
        periodStart,
        periodEnd,
        status: 'finalized',
        dataQuality: dataQuality ?? raw.data_quality ?? 'estimated',
      }
    );
  },

  async getCompensationProjection(calcId: string, data: { area_id: string; horizon_years?: number }) {
    const raw = await api.post<ApiCompensationProjection>(`/footprint/calculations/${calcId}/projection`, data);
    const calculation = await this.getCalculation(calcId);
    return normalizeProjection(raw, calculation.totalTCO2e);
  },
};
