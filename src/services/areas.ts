import { api } from '@/lib/api-client';
import { toApiUrl } from '@/config/api';
import type { Area, AreaContribution, AreaMedia, AreaCapacity, CreateAreaRequest, UpdateAreaRequest, ApproveAreaRequest } from '@/types/area';

type RawArea = {
  id?: string;
  owner_user_id?: string;
  ownerUserId?: string;
  owner_email?: string | null;
  ownerEmail?: string | null;
  name?: string;
  description?: string | null;
  latitude?: number | string;
  longitude?: number | string;
  biome?: string | null;
  state?: string | null;
  city?: string | null;
  status?: string;
  total_capacity_t_co2e?: number | string;
  totalCapacityTCO2e?: number | string;
  committed_t_co2e?: number | string;
  committedTCO2e?: number | string;
  available_t_co2e?: number | string;
  availableTCO2e?: number | string;
  t_co2e_per_tree_per_year?: number | string;
  tCO2ePerTreePerYear?: number | string;
  price_per_tree?: number | string | null;
  pricePerTree?: number | string | null;
  price_per_t_co2e?: number | string | null;
  pricePerTCO2e?: number | string | null;
  audit_notes?: string | null;
  auditNotes?: string | null;
  audited_by_user_id?: string | null;
  auditedByUserId?: string | null;
  audited_at?: string | null;
  auditedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type RawAreaContribution = {
  id?: string;
  compensation_id?: string;
  area_id?: string;
  areaId?: string;
  user_id?: string;
  supporter_user_id?: string;
  user_email?: string;
  supporter_display_name?: string;
  trees_count?: number | string;
  total_t_co2e?: number | string;
  total_amount?: number | string;
  currency?: string;
  compensation_mode?: string;
  paid_at?: string;
  compensated_at?: string;
  created_at?: string;
};

type RawAreaMedia = {
  id?: string;
  area_id?: string;
  areaId?: string;
  media_type?: 'photo' | 'video';
  mediaType?: 'photo' | 'video';
  description?: string | null;
  mime_type?: string;
  mimeType?: string;
  file_name?: string;
  fileName?: string;
  file_size_bytes?: number | string;
  fileSizeBytes?: number | string;
  download_url?: string;
  downloadUrl?: string;
  created_at?: string;
  createdAt?: string;
};

type RawAreaCapacity = {
  total_capacity_t_co2e?: number | string;
  totalCapacityTCO2e?: number | string;
  committed_t_co2e?: number | string;
  committedTCO2e?: number | string;
  available_t_co2e?: number | string;
  availableTCO2e?: number | string;
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

function asNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  return asNumber(value, 0);
}

function normalizeAreaStatus(status: unknown): string {
  if (status === 'pending') return 'pending_audit';
  return asString(status, 'draft');
}

function normalizeArea(raw: RawArea): Area {
  const available = asNumber(raw.availableTCO2e ?? raw.available_t_co2e, 0);
  const rawTotal = raw.totalCapacityTCO2e ?? raw.total_capacity_t_co2e;
  const total = rawTotal == null ? available : asNumber(rawTotal, available);
  const committedRaw = raw.committedTCO2e ?? raw.committed_t_co2e;
  const committed = committedRaw == null ? Math.max(total - available, 0) : asNumber(committedRaw, 0);

  return {
    id: asString(raw.id),
    ownerUserId: asString(raw.ownerUserId ?? raw.owner_user_id),
    ownerEmail: asNullableString(raw.ownerEmail ?? raw.owner_email),
    name: asString(raw.name),
    description: asNullableString(raw.description),
    latitude: asNumber(raw.latitude),
    longitude: asNumber(raw.longitude),
    biome: asNullableString(raw.biome),
    state: asNullableString(raw.state),
    city: asNullableString(raw.city),
    status: normalizeAreaStatus(raw.status) as Area['status'],
    totalCapacityTCO2e: total,
    committedTCO2e: committed,
    tCO2ePerTreePerYear: asNumber(raw.tCO2ePerTreePerYear ?? raw.t_co2e_per_tree_per_year),
    pricePerTree: asNullableNumber(raw.pricePerTree ?? raw.price_per_tree),
    pricePerTCO2e: asNullableNumber(raw.pricePerTCO2e ?? raw.price_per_t_co2e),
    auditNotes: asNullableString(raw.auditNotes ?? raw.audit_notes),
    auditedBy: asNullableString(raw.auditedByUserId ?? raw.audited_by_user_id),
    auditedAt: asNullableString(raw.auditedAt ?? raw.audited_at),
    createdAt: asString(raw.createdAt ?? raw.created_at),
    updatedAt: asString(raw.updatedAt ?? raw.updated_at),
  };
}

function normalizeAreaContribution(raw: RawAreaContribution, areaId: string): AreaContribution {
  return {
    id: asString(raw.id ?? raw.compensation_id),
    areaId: asString(raw.areaId ?? raw.area_id, areaId),
    userId: asString(raw.user_id ?? raw.supporter_user_id),
    userEmail: asString(raw.user_email ?? raw.supporter_display_name ?? raw.supporter_user_id),
    treesCount: asNumber(raw.trees_count),
    totalTCO2e: asNumber(raw.total_t_co2e),
    totalAmount: asNumber(raw.total_amount),
    currency: asString(raw.currency, 'BRL'),
    compensationMode: asString(raw.compensation_mode, 'tree_purchase'),
    paidAt: asString(raw.paid_at ?? raw.compensated_at ?? raw.created_at),
  };
}

function normalizeAreaMedia(raw: RawAreaMedia, areaId: string): AreaMedia {
  const id = asString(raw.id);
  const mediaPath = asString(raw.downloadUrl ?? raw.download_url, `/api/v1/areas/media/${id}/file`);
  return {
    id,
    areaId: asString(raw.areaId ?? raw.area_id, areaId),
    mediaType: (raw.mediaType ?? raw.media_type ?? 'photo') as AreaMedia['mediaType'],
    description: asNullableString(raw.description),
    mimeType: asString(raw.mimeType ?? raw.mime_type),
    fileName: asString(raw.fileName ?? raw.file_name),
    fileSize: asNumber(raw.fileSizeBytes ?? raw.file_size_bytes),
    url: toApiUrl(mediaPath),
    createdAt: asString(raw.createdAt ?? raw.created_at),
  };
}

function normalizeAreaCapacity(raw: RawAreaCapacity): AreaCapacity {
  const available = asNumber(raw.availableTCO2e ?? raw.available_t_co2e, 0);
  const totalRaw = raw.totalCapacityTCO2e ?? raw.total_capacity_t_co2e;
  const total = totalRaw == null ? available : asNumber(totalRaw, available);
  const committedRaw = raw.committedTCO2e ?? raw.committed_t_co2e;
  const committed = committedRaw == null ? Math.max(total - available, 0) : asNumber(committedRaw);

  return {
    totalCapacityTCO2e: total,
    committedTCO2e: committed,
    availableTCO2e: available,
  };
}

function normalizeAreaFilterStatus(status?: string): string | undefined {
  if (status === 'pending') return 'pending_audit';
  return status;
}

function fetchArea(id: string): Promise<Area> {
  return api.get<RawArea>(`/areas/${id}`).then(normalizeArea);
}

export const areasService = {
  async createArea(data: CreateAreaRequest) {
    const raw = await api.post<RawArea>('/areas', data);
    if (raw.id) {
      return fetchArea(raw.id);
    }
    return normalizeArea(raw);
  },

  getArea(id: string) {
    return fetchArea(id);
  },

  async updateArea(id: string, data: UpdateAreaRequest) {
    await api.patch<void>(`/areas/${id}`, data);
    return fetchArea(id);
  },

  deleteArea(id: string) {
    return api.delete<void>(`/areas/${id}`);
  },

  listAreas(params?: {
    status?: string;
    biome?: string;
    ownerUserId?: string;
    owner_user_id?: string;
    limit?: number;
    offset?: number;
  }) {
    const ownerUserId = params?.ownerUserId ?? params?.owner_user_id;
    const apiParams = {
      ...params,
      status: normalizeAreaFilterStatus(params?.status),
      ownerUserId,
      owner_user_id: undefined,
    } as Record<string, string | number | undefined>;

    return api.get<RawArea[]>('/areas', { params: apiParams }).then((rows) => rows.map(normalizeArea));
  },

  getMapAreas(params?: { biome?: string }) {
    return api
      .get<RawArea[]>('/map/areas', { params: params as Record<string, string> })
      .then((rows) => rows.map((row) => normalizeArea({ status: 'active', ...row })));
  },

  getAreaCapacity(id: string) {
    return api.get<RawAreaCapacity>(`/areas/${id}/capacity`).then(normalizeAreaCapacity);
  },

  listAreaContributions(areaId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<RawAreaContribution[]>(`/areas/${areaId}/contributions`, { params: params as Record<string, number> })
      .then((rows) => rows.map((row) => normalizeAreaContribution(row, areaId)));
  },

  listAreaMedia(areaId: string) {
    return api.get<RawAreaMedia[]>(`/areas/${areaId}/media`).then((rows) => rows.map((row) => normalizeAreaMedia(row, areaId)));
  },

  uploadAreaMedia(areaId: string, data: { media_type: string; description?: string; mime_type: string; file_name: string; file_base64: string }) {
    return api.post<RawAreaMedia>(`/areas/${areaId}/media`, data).then((raw) => normalizeAreaMedia(raw, areaId));
  },

  deleteAreaMedia(mediaId: string) {
    return api.delete<void>(`/areas/media/${mediaId}`);
  },

  getAreaMediaFile(mediaId: string) {
    return api.getBinary(`/areas/media/${mediaId}/file`);
  },

  submitForAudit(areaId: string, notes?: string) {
    return api.post<void>(`/areas/${areaId}/submit-audit`, { notes });
  },

  approveArea(areaId: string, data: ApproveAreaRequest) {
    const criteria = data.criteria && data.criteria.length > 0
      ? data.criteria
      : [{ criterion_key: 'manual_review', criterion_label: 'Manual review', met: true, notes: data.notes }];
    return api.post<void>(`/areas/${areaId}/approve`, { ...data, criteria });
  },

  rejectArea(areaId: string, reason: string) {
    return api.post<void>(`/areas/${areaId}/reject`, { reason });
  },

  activateArea(areaId: string) {
    return api.post<void>(`/areas/${areaId}/activate`);
  },

  suspendArea(areaId: string, reason?: string) {
    return api.post<void>(`/areas/${areaId}/suspend`, { reason });
  },
};
