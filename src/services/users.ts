import { api } from '@/lib/api-client';
import { toApiUrl } from '@/config/api';
import type { UserSummary, UserProfile, UserProfileUpdate, UserUpdate } from '@/types/user';
import type { CompensationHistoryItem } from '@/types/compensation';
import type { ContributionHistoryItem } from '@/types/contribution';
import type { CertificateHistoryItem } from '@/types/certificate';

type RawUserSummary = {
  id?: string;
  email?: string;
  slug?: string;
  status?: string;
  locale?: string;
  email_confirmed_at?: string | null;
  emailConfirmedAt?: string | null;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
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
  about?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  instagram_url?: string | null;
  instagramUrl?: string | null;
  facebook_url?: string | null;
  facebookUrl?: string | null;
  x_url?: string | null;
  xUrl?: string | null;
  bluesky_url?: string | null;
  blueskyUrl?: string | null;
  mastodon_url?: string | null;
  mastodonUrl?: string | null;
  youtube_url?: string | null;
  youtubeUrl?: string | null;
  linkedin_url?: string | null;
  linkedinUrl?: string | null;
  avatar_path?: string | null;
  avatarPath?: string | null;
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
  area_slug?: string | null;
  areaSlug?: string | null;
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

type RawClimateBalance = {
  gross_emissions_t_co2e?: number | string;
  estimated_offset_t_co2e?: number | string;
  net_balance_t_co2e?: number | string;
  total_trees_purchased?: number | string;
  total_contribution_amount?: number | string;
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
    slug: asString(raw.slug),
    status: asString(raw.status, 'pending'),
    locale: asString(raw.locale, 'pt-BR'),
    emailConfirmedAt: asNullableString(raw.email_confirmed_at ?? raw.emailConfirmedAt),
    lastLoginAt: asNullableString(raw.last_login_at ?? raw.lastLoginAt),
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
    about: asNullableString(raw.about ?? raw.about),
    websiteUrl: asNullableString(raw.website_url ?? raw.websiteUrl),
    instagramUrl: asNullableString(raw.instagram_url ?? raw.instagramUrl),
    facebookUrl: asNullableString(raw.facebook_url ?? raw.facebookUrl),
    xUrl: asNullableString(raw.x_url ?? raw.xUrl),
    blueskyUrl: asNullableString(raw.bluesky_url ?? raw.blueskyUrl),
    mastodonUrl: asNullableString(raw.mastodon_url ?? raw.mastodonUrl),
    youtubeUrl: asNullableString(raw.youtube_url ?? raw.youtubeUrl),
    linkedinUrl: asNullableString(raw.linkedin_url ?? raw.linkedinUrl),
    avatarPath: asNullableString(raw.avatar_path ?? raw.avatarPath),
    createdAt: asString(raw.created_at ?? raw.createdAt),
    updatedAt: asString(raw.updated_at ?? raw.updatedAt),
  };
}

function normalizeCompensation(raw: RawCompensation): CompensationHistoryItem {
  return {
    id: asString(raw.id),
    areaId: asString(raw.area_id ?? raw.areaId),
    areaName: asString(raw.area_name ?? raw.areaName),
    areaSlug: asNullableString(raw.area_slug ?? raw.areaSlug) ?? undefined,
    calculationId: asNullableString(raw.calculation_id ?? raw.calculationId),
    compensationMode: asString(raw.compensation_mode ?? raw.compensationMode, 'tco2e') as CompensationHistoryItem['compensationMode'],
    totalTCO2e: asNumber(raw.total_t_co2e ?? raw.totalTCO2e),
    treesCount: asNumber(raw.trees_count ?? raw.treesCount),
    totalAmount: asNumber(raw.total_amount ?? raw.totalAmount),
    currency: asString(raw.currency, 'USD'),
    status: asString(raw.status, 'pending') as CompensationHistoryItem['status'],
    createdAt: asString(raw.created_at ?? raw.createdAt),
    paidAt: asNullableString(raw.paid_at ?? raw.paidAt),
  };
}

function normalizeContribution(raw: RawCompensation): ContributionHistoryItem {
  return {
    id: asString(raw.id),
    areaId: asString(raw.area_id ?? raw.areaId),
    areaName: asString(raw.area_name ?? raw.areaName),
    areaSlug: asNullableString(raw.area_slug ?? raw.areaSlug) ?? undefined,
    calculationId: asNullableString(raw.calculation_id ?? raw.calculationId),
    compensationMode: asString(raw.compensation_mode ?? raw.compensationMode, 'tco2e') as ContributionHistoryItem['compensationMode'],
    totalTCO2e: asNumber(raw.total_t_co2e ?? raw.totalTCO2e),
    treesCount: asNumber(raw.trees_count ?? raw.treesCount),
    totalAmount: asNumber(raw.total_amount ?? raw.totalAmount),
    currency: asString(raw.currency, 'USD'),
    status: asString(raw.status, 'pending') as ContributionHistoryItem['status'],
    createdAt: asString(raw.created_at ?? raw.createdAt),
    paidAt: asNullableString(raw.paid_at ?? raw.paidAt),
  };
}

function normalizeClimateBalance(raw: RawClimateBalance) {
  return {
    grossEmissionsTCO2e: asNumber(raw.gross_emissions_t_co2e),
    estimatedOffsetTCO2e: asNumber(raw.estimated_offset_t_co2e),
    netBalanceTCO2e: asNumber(raw.net_balance_t_co2e),
    totalTreesPurchased: asNumber(raw.total_trees_purchased),
    totalContributionAmount: asNumber(raw.total_contribution_amount),
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

type RawDirectoryItem = {
  id?: string;
  slug?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  about?: string | null;
  country_code?: string | null;
  total_areas?: number | string;
  total_trees?: number | string;
  created_at?: string;
};

export type DirectoryItem = {
  id: string;
  slug: string;
  displayName: string | null;
  avatarUrl: string | null;
  about: string | null;
  countryCode: string | null;
  totalAreas: number;
  totalTrees: number;
  createdAt: string;
};

function normalizeDirectoryItem(raw: RawDirectoryItem): DirectoryItem {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    displayName: asNullableString(raw.display_name),
    avatarUrl: raw.avatar_url ? toApiUrl(raw.avatar_url) : null,
    countryCode: asNullableString(raw.country_code),
    about: asNullableString(raw.about),
    totalAreas: asNumber(raw.total_areas),
    totalTrees: asNumber(raw.total_trees),
    createdAt: asString(raw.created_at),
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

  listUsers(params?: { search?: string; status?: string; sort_by?: string; sort_order?: string; limit?: number; offset?: number }) {
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

  getUserContributions(userId: string, params?: { limit?: number; offset?: number; status?: string }) {
    return api
      .get<RawCompensation[]>(`/users/${userId}/contributions`, {
        params: params as Record<string, string | number>,
      })
      .then((rows) => rows.map(normalizeContribution));
  },

  getClimateBalance(userId: string) {
    return api
      .get<RawClimateBalance>(`/users/${userId}/climate-balance`)
      .then(normalizeClimateBalance);
  },

  uploadAvatar(userId: string, data: { mime_type: string; file_base64: string }) {
    return api.post<{ avatar_path: string; avatar_url: string }>(`/users/${userId}/profile/avatar`, data);
  },

  listDirectory(params?: { limit?: number; offset?: number }) {
    return api
      .get<RawDirectoryItem[]>('/directory/users', { params: params as Record<string, number> })
      .then((rows) => rows.map(normalizeDirectoryItem));
  },

  getUserCertificates(userId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<RawCertificate[]>(`/users/${userId}/certificates`, { params: params as Record<string, number> })
      .then((rows) => rows.map(normalizeCertificate));
  },
};
