import { api } from '@/lib/api-client';
import type { AuditLogEntry } from '@/types/audit';

type RawAuditEntry = {
  id?: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  client_ip?: string | null;
  action?: string;
  entity_type?: string;
  entity_id?: string | null;
  reason?: string | null;
  created_at?: string;
  user_agent?: string | null;
  request_id?: string | null;
  success?: boolean;
  error_code?: string | null;
  http_status?: number | null;
  severity?: string;
  category?: string[] | null;
  duration_ms?: number | null;
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeEntry(raw: RawAuditEntry): AuditLogEntry {
  return {
    id: asString(raw.id),
    actorUserId: asNullableString(raw.actor_user_id),
    actorEmail: asNullableString(raw.actor_email),
    clientIp: asNullableString(raw.client_ip),
    action: asString(raw.action),
    entityType: asString(raw.entity_type),
    entityId: asNullableString(raw.entity_id),
    reason: asNullableString(raw.reason),
    createdAt: asString(raw.created_at),
    userAgent: asNullableString(raw.user_agent),
    requestId: asNullableString(raw.request_id),
    success: raw.success !== false,
    errorCode: asNullableString(raw.error_code),
    httpStatus: typeof raw.http_status === 'number' ? raw.http_status : null,
    severity: asString(raw.severity, 'info'),
    category: Array.isArray(raw.category)
      ? raw.category.filter((item): item is string => typeof item === 'string')
      : [],
    durationMs: typeof raw.duration_ms === 'number' ? raw.duration_ms : null,
  };
}

export const auditLogService = {
  listAuditLog(params?: { actor_user_id?: string; entity_type?: string; entity_id?: string; limit?: number; offset?: number }) {
    return api
      .get<RawAuditEntry[]>('/audit-log', { params: params as Record<string, string | number> })
      .then((rows) => rows.map(normalizeEntry));
  },
};
