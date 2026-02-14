import { api } from '@/lib/api-client';
import type { UserSummary, UserProfile, UserProfileUpdate, UserUpdate } from '@/types/user';
import type { CompensationHistoryItem } from '@/types/compensation';
import type { CertificateHistoryItem } from '@/types/certificate';

type RawUserSummary = {
  id?: string;
  email?: string;
  status?: string;
  locale?: string;
  email_confirmed_at?: string | null;
  emailConfirmedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  roles?: unknown;
};

type RawUserProfile = {
  id?: string;
  user_id?: string;
  userId?: string;
  display_name?: string | null;
  displayName?: string | null;
  document_type?: string | null;
  documentType?: string | null;
  document_number?: string | null;
  documentNumber?: string | null;
  birth_date?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  country_code?: string | null;
  countryCode?: string | null;
  address_line1?: string | null;
  addressLine1?: string | null;
  address_line2?: string | null;
  addressLine2?: string | null;
  address_city?: string | null;
  addressCity?: string | null;
  address_state?: string | null;
  addressState?: string | null;
  address_postal_code?: string | null;
  addressPostalCode?: string | null;
  address_country?: string | null;
  addressCountry?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type RawCompensation = {
  id?: string;
  area_id?: string;
  areaId?: string;
  area_name?: string | null;
  areaName?: string | null;
  calculation_id?: string | null;
  calculationId?: string | null;
  compensation_mode?: string;
  compensationMode?: string;
  total_t_co2e?: number | string;
  totalTCO2e?: number | string;
  trees_count?: number | string | null;
  treesCount?: number | string | null;
  total_amount?: number | string;
  totalAmount?: number | string;
  currency?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  paid_at?: string | null;
  paidAt?: string | null;
};

type RawCertificate = {
  id?: string;
  certificate_number?: string;
  certificateNumber?: string;
  compensation_id?: string;
  compensationId?: string;
  status?: string;
  issued_at?: string | null;
  issuedAt?: string | null;
  file_name?: string;
  fileName?: string;
  mime_type?: string;
  mimeType?: string;
  authenticity_hash?: string | null;
  authenticityHash?: string | null;
  validation_url?: string | null;
  validationUrl?: string | null;
  qr_code_data?: string | null;
  qrCodeData?: string | null;
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

function normalizeUserSummary(raw: RawUserSummary): UserSummary {
  const roles = Array.isArray(raw.roles)
    ? raw.roles.filter((role): role is string => typeof role === 'string')
    : [];

  return {
    id: asString(raw.id),
    email: asString(raw.email),
    status: asString(raw.status, 'pending'),
    locale: asString(raw.locale, 'pt-BR'),
    emailConfirmedAt: asNullableString(raw.email_confirmed_at ?? raw.emailConfirmedAt),
    createdAt: asString(raw.created_at ?? raw.createdAt),
    roles,
  };
}

function normalizeUserProfile(raw: RawUserProfile): UserProfile {
  return {
    id: asString(raw.id),
    userId: asString(raw.user_id ?? raw.userId),
    displayName: asNullableString(raw.display_name ?? raw.displayName),
    documentType: asNullableString(raw.document_type ?? raw.documentType),
    documentNumber: asNullableString(raw.document_number ?? raw.documentNumber),
    birthDate: asNullableString(raw.birth_date ?? raw.birthDate),
    phone: asNullableString(raw.phone),
    countryCode: asNullableString(raw.country_code ?? raw.countryCode),
    addressLine1: asNullableString(raw.address_line1 ?? raw.addressLine1),
    addressLine2: asNullableString(raw.address_line2 ?? raw.addressLine2),
    addressCity: asNullableString(raw.address_city ?? raw.addressCity),
    addressState: asNullableString(raw.address_state ?? raw.addressState),
    addressPostalCode: asNullableString(raw.address_postal_code ?? raw.addressPostalCode),
    addressCountry: asNullableString(raw.address_country ?? raw.addressCountry),
    createdAt: asString(raw.created_at ?? raw.createdAt),
    updatedAt: asString(raw.updated_at ?? raw.updatedAt),
  };
}

function normalizeCompensation(raw: RawCompensation): CompensationHistoryItem {
  return {
    id: asString(raw.id),
    areaId: asString(raw.area_id ?? raw.areaId),
    areaName: asString(raw.area_name ?? raw.areaName),
    calculationId: asNullableString(raw.calculation_id ?? raw.calculationId),
    compensationMode: asString(raw.compensation_mode ?? raw.compensationMode, 'tco2e') as CompensationHistoryItem['compensationMode'],
    totalTCO2e: asNumber(raw.total_t_co2e ?? raw.totalTCO2e),
    treesCount: asNumber(raw.trees_count ?? raw.treesCount),
    totalAmount: asNumber(raw.total_amount ?? raw.totalAmount),
    currency: asString(raw.currency, 'BRL'),
    status: asString(raw.status, 'pending') as CompensationHistoryItem['status'],
    createdAt: asString(raw.created_at ?? raw.createdAt),
    paidAt: asNullableString(raw.paid_at ?? raw.paidAt),
  };
}

function normalizeCertificate(raw: RawCertificate): CertificateHistoryItem {
  return {
    id: asString(raw.id),
    certificateNumber: asString(raw.certificate_number ?? raw.certificateNumber),
    compensationId: asString(raw.compensation_id ?? raw.compensationId),
    status: asString(raw.status),
    issuedAt: asString(raw.issued_at ?? raw.issuedAt),
    fileName: asString(raw.file_name ?? raw.fileName),
    mimeType: asString(raw.mime_type ?? raw.mimeType, 'application/pdf'),
    authenticityHash: asNullableString(raw.authenticity_hash ?? raw.authenticityHash),
    validationUrl: asNullableString(raw.validation_url ?? raw.validationUrl),
    qrCodeData: asNullableString(raw.qr_code_data ?? raw.qrCodeData),
    areaName: null,
    totalTCO2e: null,
    treesCount: null,
  };
}

export const usersService = {
  getUser(userId: string) {
    return api.get<RawUserSummary>(`/users/${userId}`).then(normalizeUserSummary);
  },

  getUserProfile(userId: string) {
    return api.get<RawUserProfile | null>(`/users/${userId}/profile`).then((raw) =>
      raw ? normalizeUserProfile(raw) : null
    );
  },

  upsertProfile(userId: string, data: UserProfileUpdate) {
    return api.put<RawUserProfile>(`/users/${userId}/profile`, data).then(normalizeUserProfile);
  },

  listUsers(params?: { search?: string; status?: string; limit?: number; offset?: number }) {
    return api.get<RawUserSummary[]>('/users', { params: params as Record<string, string | number> }).then((rows) =>
      rows.map(normalizeUserSummary)
    );
  },

  updateUser(userId: string, data: UserUpdate) {
    return api.patch<RawUserSummary>(`/users/${userId}`, data).then(normalizeUserSummary);
  },

  deleteUser(userId: string) {
    return api.delete<void>(`/users/${userId}`);
  },

  getUserCompensations(userId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<RawCompensation[]>(`/users/${userId}/compensations`, { params: params as Record<string, number> })
      .then((rows) => rows.map(normalizeCompensation));
  },

  getUserCertificates(userId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<RawCertificate[]>(`/users/${userId}/certificates`, { params: params as Record<string, number> })
      .then((rows) => rows.map(normalizeCertificate));
  },
};
