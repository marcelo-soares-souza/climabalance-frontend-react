export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  actorEmail: string;
  clientIp: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  createdAt: string;
  userAgent: string;
  requestId: string;
  success: boolean;
  errorCode: string | null;
  httpStatus: number;
  severity: string;
  category: string[];
  durationMs: number;
}
