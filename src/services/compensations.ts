import { api } from '@/lib/api-client';
import type { CompensationQuote, CreateCompensationRequest, CompensationConfirmation, CompensationHistoryItem } from '@/types/compensation';
import type { AreaContribution } from '@/types/area';

export const compensationsService = {
  createCompensation(data: CreateCompensationRequest) {
    return api.post<CompensationConfirmation>('/compensations', data);
  },

  getQuote(data: { area_id: string; trees_requested: number; currency: string }) {
    return api.post<CompensationQuote>('/compensations/quote', data);
  },

  listCompensations(params?: { status?: string; limit?: number; offset?: number }) {
    return api.get<CompensationHistoryItem[]>('/compensations', { params: params as Record<string, string | number> });
  },

  listAreaContributions(areaId: string, params?: { limit?: number; offset?: number }) {
    return api.get<AreaContribution[]>(`/areas/${areaId}/contributions`, { params: params as Record<string, number> });
  },
};
