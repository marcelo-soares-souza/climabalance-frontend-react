export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  clientIp: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  createdAt: string;
  userAgent: string | null;
  requestId: string | null;
  success: boolean;
  errorCode: string | null;
  httpStatus: number | null;
  severity: string;
  category: string[];
  durationMs: number | null;
}
