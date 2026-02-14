import { api } from '@/lib/api-client';
import type { UserSummary, UserProfile, UserProfileUpdate, UserUpdate } from '@/types/user';
import type { CompensationHistoryItem } from '@/types/compensation';
import type { CertificateHistoryItem } from '@/types/certificate';

export const usersService = {
  getUser(userId: string) {
    return api.get<UserSummary>(`/users/${userId}`);
  },

  getUserProfile(userId: string) {
    return api.get<UserProfile>(`/users/${userId}/profile`);
  },

  upsertProfile(userId: string, data: UserProfileUpdate) {
    return api.put<UserProfile>(`/users/${userId}/profile`, data);
  },

  listUsers(params?: { search?: string; status?: string; limit?: number; offset?: number }) {
    return api.get<UserSummary[]>('/users', { params: params as Record<string, string | number> });
  },

  updateUser(userId: string, data: UserUpdate) {
    return api.patch<UserSummary>(`/users/${userId}`, data);
  },

  deleteUser(userId: string) {
    return api.delete<void>(`/users/${userId}`);
  },

  getUserCompensations(userId: string, params?: { limit?: number; offset?: number }) {
    return api.get<CompensationHistoryItem[]>(`/users/${userId}/compensations`, { params: params as Record<string, number> });
  },

  getUserCertificates(userId: string, params?: { limit?: number; offset?: number }) {
    return api.get<CertificateHistoryItem[]>(`/users/${userId}/certificates`, { params: params as Record<string, number> });
  },
};
