import { api } from '@/lib/api-client';
import type { Area, AreaContribution, AreaCriterion, AreaMedia, AreaCapacity, CreateAreaRequest, UpdateAreaRequest, ApproveAreaRequest } from '@/types/area';

export const areasService = {
  createArea(data: CreateAreaRequest) {
    return api.post<Area>('/areas', data);
  },

  getArea(id: string) {
    return api.get<Area>(`/areas/${id}`);
  },

  updateArea(id: string, data: UpdateAreaRequest) {
    return api.patch<Area>(`/areas/${id}`, data);
  },

  deleteArea(id: string) {
    return api.delete<void>(`/areas/${id}`);
  },

  listAreas(params?: { status?: string; biome?: string; owner_user_id?: string; limit?: number; offset?: number }) {
    return api.get<Area[]>('/areas', { params: params as Record<string, string | number> });
  },

  getMapAreas(params?: { biome?: string; state?: string; city?: string }) {
    return api.get<Area[]>('/map/areas', { params: params as Record<string, string> });
  },

  getAreaCapacity(id: string) {
    return api.get<AreaCapacity>(`/areas/${id}/capacity`);
  },

  listAreaContributions(areaId: string, params?: { limit?: number; offset?: number }) {
    return api.get<AreaContribution[]>(`/areas/${areaId}/contributions`, { params: params as Record<string, number> });
  },

  listAreaMedia(areaId: string) {
    return api.get<AreaMedia[]>(`/areas/${areaId}/media`);
  },

  uploadAreaMedia(areaId: string, data: { media_type: string; description?: string; mime_type: string; file_name: string; file_base64: string }) {
    return api.post<AreaMedia>(`/areas/${areaId}/media`, data);
  },

  deleteAreaMedia(mediaId: string) {
    return api.delete<void>(`/areas/media/${mediaId}`);
  },

  getAreaMediaFile(mediaId: string) {
    return api.getBinary(`/areas/media/${mediaId}/file`);
  },

  submitForAudit(areaId: string, notes?: string) {
    return api.post<Area>(`/areas/${areaId}/submit-audit`, { notes });
  },

  approveArea(areaId: string, data: ApproveAreaRequest) {
    return api.post<Area>(`/areas/${areaId}/approve`, data);
  },

  rejectArea(areaId: string, reason: string) {
    return api.post<Area>(`/areas/${areaId}/reject`, { reason });
  },

  activateArea(areaId: string) {
    return api.post<Area>(`/areas/${areaId}/activate`);
  },

  suspendArea(areaId: string, reason?: string) {
    return api.post<Area>(`/areas/${areaId}/suspend`, { reason });
  },
};
