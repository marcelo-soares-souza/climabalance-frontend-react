import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/audit-log';
import { Card, CardContent } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Shield, Search } from 'lucide-react';

export function AuditLogPage() {
  const { t } = useTranslation();
  const [entityFilter, setEntityFilter] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log', { entity_type: entityFilter }],
    queryFn: () => auditLogService.listAuditLog({ entity_type: entityFilter || undefined, limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin.auditLog.title')}</h1>
      <div className="flex gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-[var(--radius-input)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={t('admin.auditLog.filterEntity')}
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="p-4"><SkeletonTable rows={10} cols={5} /></div> : entries && entries.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">{t('admin.auditLog.timestamp')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('admin.auditLog.actor')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('admin.auditLog.action')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('admin.auditLog.entity')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('admin.auditLog.status')}</th>
              </tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-3">{entry.actorEmail}</td>
                    <td className="px-4 py-3"><Badge>{entry.action}</Badge></td>
                    <td className="px-4 py-3">{entry.entityType}/{entry.entityId?.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.success ? 'success' : 'error'}>{entry.success ? 'OK' : `${entry.httpStatus}`}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="p-8"><EmptyState icon={<Shield className="h-12 w-12" />} title={t('admin.auditLog.empty')} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
