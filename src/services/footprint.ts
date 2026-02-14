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
} from '@/types/footprint';
import { API_BASE } from '@/config/api';

export const footprintService = {
  createCalculation(data: CreateCalculationRequest) {
    return api.post<CalculationResult>('/footprint/calculations', data);
  },

  getCalculation(id: string) {
    return api.get<FootprintCalculation>(`/footprint/calculations/${id}`);
  },

  updateCalculation(id: string, data: UpdateCalculationRequest) {
    return api.patch<CalculationResult>(`/footprint/calculations/${id}`, data);
  },

  finalizeCalculation(id: string) {
    return api.post<CalculationResult>(`/footprint/calculations/${id}/finalize`);
  },

  deleteCalculation(id: string) {
    return api.delete<void>(`/footprint/calculations/${id}`);
  },

  listCalculations(params?: { status?: string; profile_type?: string; limit?: number; offset?: number }) {
    return api.get<CalculationResult[]>('/footprint/calculations', { params: params as Record<string, string | number> });
  },

  getEmissionFactors(params?: { category?: string; unit?: string; version?: string; region?: string }) {
    return api.get<EmissionFactor[]>('/footprint/emission-factors', { params: params as Record<string, string> });
  },

  async calculateGuest(profileType: ProfileType, inputs: FootprintInput[]) {
    const res = await fetch(`${API_BASE}/footprint/calculate-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_type: profileType, inputs }),
    });
    if (!res.ok) throw new Error('Calculation failed');
    const json = await res.json();
    return (json.data || json) as CalculationResult;
  },

  getCompensationProjection(calcId: string, data?: { horizon_years?: number }) {
    return api.post<CompensationProjection>(`/footprint/calculations/${calcId}/projection`, data);
  },
};
