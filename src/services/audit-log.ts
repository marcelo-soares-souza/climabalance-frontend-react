import { api } from '@/lib/api-client';
import type { AuditLogEntry } from '@/types/audit';

export const auditLogService = {
  listAuditLog(params?: { actor_user_id?: string; entity_type?: string; entity_id?: string; limit?: number; offset?: number }) {
    return api.get<AuditLogEntry[]>('/audit-log', { params: params as Record<string, string | number> });
  },
};
